import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';
import { WALKTHROUGH_STEP_COUNT } from '../app/walkthroughContent';
import {
  getBaseAssumptionBundle,
  getChangedAssumptionKeys,
  type AssumptionGroup,
  type AssumptionGroupId,
  type AssumptionMetadata,
  type AssumptionSidebarMode,
  type AssumptionValueMap,
} from '../model/assumptions';
import {
  assumptionsSchema,
  scenarioSchema,
  type ScenarioPayload,
} from '../model/schemas';
import {
  buildA2FleetOutputCards,
  runA2FleetWorkbook,
  type A2FleetOutputCard,
  type A2FleetWorkbookOutput,
} from '../engine/a2Fleet';
import { type DisplayCurrency } from '../model/displayCurrency';
import {
  runIntegratedModel,
  type IntegratedModelOutput,
} from '../engine/integrated';
import {
  buildCalculationToast,
  type CalculationToast,
} from '../model/calculationToasts';

export type ThemeMode = 'light' | 'dark';
export type RunState = 'empty' | 'running' | 'ready' | 'stale' | 'error';

type ValidationIssueMap = Record<string, string[]>;

type AppSlice = {
  currentScenarioId: string;
  runState: RunState;
  errorMessage: string | null;
  hasSuccessfulCalculation: boolean;
  lastCalculatedAt: number | null;
  activePathname: string;
};

type AssumptionsSlice = {
  baseValues: AssumptionValueMap;
  currentValues: AssumptionValueMap;
  metadata: AssumptionMetadata[];
  metadataByKey: Record<string, AssumptionMetadata>;
  groups: AssumptionGroup[];
  changedKeys: string[];
  referenceSource: string;
};

type ScenariosSlice = {
  byId: Record<string, ScenarioPayload>;
  allIds: string[];
  dirtyIds: string[];
  compareIds: string[];
};

type UISlice = {
  theme: ThemeMode;
  displayCurrency: DisplayCurrency;
  isPrimarySidebarOpen: boolean;
  isAssumptionsOpen: boolean;
  isUtilityPanelOpen: boolean;
  assumptionsSidebarWidth: number;
  assumptionSidebarMode: AssumptionSidebarMode;
  selectedAssumptionKey: string | null;
  selectedKpiId: string | null;
  isWalkthroughOpen: boolean;
  walkthroughStep: number;
  toasts: CalculationToast[];
};

type ValidationSlice = {
  assumptions: {
    isValid: boolean;
    issuesByKey: ValidationIssueMap;
    lastValidatedAt: number | null;
  };
  scenarios: {
    isValid: boolean;
    issuesById: ValidationIssueMap;
    lastValidatedAt: number | null;
  };
};

type OutputsSlice = {
  results: A2FleetOutputCard[] | null;
  lastSuccessfulResults: A2FleetOutputCard[] | null;
  previousResults: A2FleetOutputCard[] | null;
  workbook: A2FleetWorkbookOutput | null;
  lastSuccessfulWorkbook: A2FleetWorkbookOutput | null;
  previousWorkbook: A2FleetWorkbookOutput | null;
  integrated: IntegratedModelOutput | null;
  lastSuccessfulIntegrated: IntegratedModelOutput | null;
  previousIntegrated: IntegratedModelOutput | null;
};

export type AppStoreState = {
  app: AppSlice;
  assumptions: AssumptionsSlice;
  scenarios: ScenariosSlice;
  ui: UISlice;
  validation: ValidationSlice;
  outputs: OutputsSlice;
  setActivePathname: (pathname: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  toggleTheme: () => void;
  togglePrimarySidebar: () => void;
  toggleAssumptions: () => void;
  toggleUtilityPanel: () => void;
  setAssumptionsSidebarWidth: (width: number) => void;
  setAssumptionSidebarMode: (mode: AssumptionSidebarMode) => void;
  openWalkthrough: () => void;
  closeWalkthrough: () => void;
  nextWalkthroughStep: () => void;
  previousWalkthroughStep: () => void;
  goToWalkthroughStep: (step: number) => void;
  dismissToast: (toastId: string) => void;
  dismissAllToasts: () => void;
  setAssumption: (path: string, value: number) => void;
  setAssumptionsBatch: (values: Partial<AssumptionValueMap>) => void;
  resetToBase: () => void;
  resetGroupToBase: (groupId: AssumptionGroupId) => void;
  createScenario: (name?: string) => string | null;
  markScenarioDirty: (scenarioId?: string) => void;
  saveScenario: (name?: string) => string | null;
  duplicateScenario: (scenarioId?: string) => string | null;
  renameScenario: (scenarioId: string, name: string) => void;
  deleteScenario: (scenarioId: string) => void;
  setScenarioProbability: (scenarioId: string, probability: number) => void;
  toggleScenarioCompare: (scenarioId: string) => void;
  clearScenarioCompare: () => void;
  loadScenario: (scenarioId: string) => void;
  calculateNow: () => void;
  selectAssumption: (key: string | null) => void;
  selectKpi: (id: string | null) => void;
  resetStore: () => void;
};

export const MOCK_RECALC_DEBOUNCE_MS = 900;
export const MOCK_CALCULATION_DELAY_MS = 1200;
export const ASSUMPTIONS_SIDEBAR_WIDTH = {
  min: 320,
  max: 560,
  default: 360,
} as const;

const BASE_SCENARIO_ID = 'base-reference';
const WALKTHROUGH_MAX_STEP = WALKTHROUGH_STEP_COUNT - 1;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let calculationTimer: ReturnType<typeof setTimeout> | null = null;
let scenarioCounter = 1;
let toastCounter = 1;

function clearTimers() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (calculationTimer) {
    clearTimeout(calculationTimer);
    calculationTimer = null;
  }
}

function toIssueMap(error: z.ZodError) {
  return error.issues.reduce<ValidationIssueMap>((map, issue) => {
    const key = issue.path.join('.') || 'root';
    map[key] ??= [];
    map[key].push(issue.message);
    return map;
  }, {});
}

function validateAssumptionValues(values: AssumptionValueMap) {
  const parsed = assumptionsSchema.safeParse(values);
  if (parsed.success) {
    return {
      isValid: true,
      values: parsed.data,
      issuesByKey: {} as ValidationIssueMap,
    };
  }

  return {
    isValid: false,
    values,
    issuesByKey: toIssueMap(parsed.error),
  };
}

function validateScenarioMap(byId: Record<string, ScenarioPayload>) {
  const issuesById: ValidationIssueMap = {};
  let isValid = true;

  Object.values(byId).forEach((scenario) => {
    const parsed = scenarioSchema.safeParse(scenario);
    if (!parsed.success) {
      isValid = false;
      issuesById[scenario.id] = parsed.error.issues.map((issue) => issue.message);
    }
  });

  return { isValid, issuesById };
}

function buildInitialState(): Omit<
  AppStoreState,
  | 'setActivePathname'
  | 'setTheme'
  | 'setDisplayCurrency'
  | 'toggleTheme'
  | 'togglePrimarySidebar'
  | 'toggleAssumptions'
  | 'toggleUtilityPanel'
  | 'setAssumptionsSidebarWidth'
  | 'setAssumptionSidebarMode'
  | 'openWalkthrough'
  | 'closeWalkthrough'
  | 'nextWalkthroughStep'
  | 'previousWalkthroughStep'
  | 'goToWalkthroughStep'
  | 'dismissToast'
  | 'dismissAllToasts'
  | 'setAssumption'
  | 'setAssumptionsBatch'
  | 'resetToBase'
  | 'resetGroupToBase'
  | 'createScenario'
  | 'markScenarioDirty'
  | 'saveScenario'
  | 'duplicateScenario'
  | 'renameScenario'
  | 'deleteScenario'
  | 'setScenarioProbability'
  | 'toggleScenarioCompare'
  | 'clearScenarioCompare'
  | 'loadScenario'
  | 'calculateNow'
  | 'selectAssumption'
  | 'selectKpi'
  | 'resetStore'
> {
  const bundle = getBaseAssumptionBundle();
  const now = Date.now();
  const baseScenario: ScenarioPayload = {
    id: BASE_SCENARIO_ID,
    name: 'Base Reference',
    probability: 100,
    assumptionValues: assumptionsSchema.parse(bundle.baseValues),
    createdAt: now,
    updatedAt: now,
    sourceScenarioId: null,
    isDirty: false,
    kind: 'base',
  };

  return {
    app: {
      currentScenarioId: BASE_SCENARIO_ID,
      runState: 'empty',
      errorMessage: null,
      hasSuccessfulCalculation: false,
      lastCalculatedAt: null,
      activePathname: '/',
    },
    assumptions: {
      baseValues: bundle.baseValues,
      currentValues: bundle.baseValues,
      metadata: bundle.metadata,
      metadataByKey: bundle.metadataByKey,
      groups: bundle.groups,
      changedKeys: [],
      referenceSource: bundle.referenceSource,
    },
    scenarios: {
      byId: { [BASE_SCENARIO_ID]: baseScenario },
      allIds: [BASE_SCENARIO_ID],
      dirtyIds: [],
      compareIds: [],
    },
    ui: {
      theme: 'light',
      displayCurrency: 'USD',
      isPrimarySidebarOpen: true,
      isAssumptionsOpen: true,
      isUtilityPanelOpen: false,
      assumptionsSidebarWidth: ASSUMPTIONS_SIDEBAR_WIDTH.default,
      assumptionSidebarMode: 'context',
      selectedAssumptionKey: null,
      selectedKpiId: null,
      isWalkthroughOpen: true,
      walkthroughStep: 0,
      toasts: [],
    },
    validation: {
      assumptions: {
        isValid: true,
        issuesByKey: {},
        lastValidatedAt: now,
      },
      scenarios: {
        isValid: true,
        issuesById: {},
        lastValidatedAt: now,
      },
    },
    outputs: {
      results: null,
      lastSuccessfulResults: null,
      previousResults: null,
      workbook: null,
      lastSuccessfulWorkbook: null,
      previousWorkbook: null,
      integrated: null,
      lastSuccessfulIntegrated: null,
      previousIntegrated: null,
    },
  };
}

function setValidationState(
  values: AssumptionValueMap,
  byId: Record<string, ScenarioPayload>,
) {
  const assumptionValidation = validateAssumptionValues(values);
  const scenarioValidation = validateScenarioMap(byId);

  return {
    validation: {
      assumptions: {
        isValid: assumptionValidation.isValid,
        issuesByKey: assumptionValidation.issuesByKey,
        lastValidatedAt: Date.now(),
      },
      scenarios: {
        isValid: scenarioValidation.isValid,
        issuesById: scenarioValidation.issuesById,
        lastValidatedAt: Date.now(),
      },
    },
  };
}

function applyAssumptionChange(
  state: AppStoreState,
  nextValues: AssumptionValueMap,
): Partial<AppStoreState> {
  const changedKeys = getChangedAssumptionKeys(
    nextValues,
    state.assumptions.baseValues,
  );
  const currentScenarioId = state.app.currentScenarioId;
  const dirtyIds = new Set(state.scenarios.dirtyIds);
  const currentScenario = state.scenarios.byId[currentScenarioId];
  const nextById = { ...state.scenarios.byId };

  if (currentScenario && currentScenario.kind === 'saved') {
    const isDirty =
      JSON.stringify(currentScenario.assumptionValues) !== JSON.stringify(nextValues);
    if (isDirty) {
      dirtyIds.add(currentScenarioId);
    } else {
      dirtyIds.delete(currentScenarioId);
    }

    nextById[currentScenarioId] = {
      ...currentScenario,
      isDirty,
      updatedAt: Date.now(),
    };
  }

  const nextState: Partial<AppStoreState> = {
    assumptions: {
      ...state.assumptions,
      currentValues: nextValues,
      changedKeys,
    },
    scenarios: {
      ...state.scenarios,
      byId: nextById,
      dirtyIds: [...dirtyIds],
    },
    app: {
      ...state.app,
      runState: state.app.hasSuccessfulCalculation ? 'stale' : state.app.runState,
      errorMessage: state.app.hasSuccessfulCalculation ? null : state.app.errorMessage,
    },
    outputs: {
      ...state.outputs,
      results: state.app.hasSuccessfulCalculation
        ? state.outputs.results ?? state.outputs.lastSuccessfulResults
        : state.outputs.results,
      workbook: state.app.hasSuccessfulCalculation
        ? state.outputs.workbook ?? state.outputs.lastSuccessfulWorkbook
        : state.outputs.workbook,
      integrated: state.app.hasSuccessfulCalculation
        ? state.outputs.integrated ?? state.outputs.lastSuccessfulIntegrated
        : state.outputs.integrated,
    },
  };

  return {
    ...nextState,
    ...setValidationState(nextValues, nextById),
  };
}

function generateScenarioId() {
  scenarioCounter += 1;
  return `scenario-${scenarioCounter}`;
}

function generateToastId() {
  toastCounter += 1;
  return `toast-${toastCounter}`;
}

function sanitizeAssumptionSidebarMode(mode: unknown): AssumptionSidebarMode {
  return mode === 'all' || mode === 'changed' ? mode : 'context';
}

function sanitizeDisplayCurrency(value: unknown): DisplayCurrency {
  return value === 'ETB' ? 'ETB' : 'USD';
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),
      setActivePathname: (pathname) =>
        set((state) => ({
          app: {
            ...state.app,
            activePathname: pathname,
          },
        })),
      setTheme: (theme) =>
        set((state) => ({
          ui: {
            ...state.ui,
            theme,
          },
        })),
      setDisplayCurrency: (displayCurrency) =>
        set((state) => ({
          ui: {
            ...state.ui,
            displayCurrency,
          },
        })),
      toggleTheme: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            theme: state.ui.theme === 'light' ? 'dark' : 'light',
          },
        })),
      togglePrimarySidebar: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isPrimarySidebarOpen: !state.ui.isPrimarySidebarOpen,
          },
        })),
      toggleAssumptions: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isAssumptionsOpen: !state.ui.isAssumptionsOpen,
          },
        })),
      toggleUtilityPanel: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isUtilityPanelOpen: !state.ui.isUtilityPanelOpen,
          },
        })),
      setAssumptionsSidebarWidth: (width) =>
        set((state) => ({
          ui: {
            ...state.ui,
            assumptionsSidebarWidth: Math.max(
              ASSUMPTIONS_SIDEBAR_WIDTH.min,
              Math.min(ASSUMPTIONS_SIDEBAR_WIDTH.max, width),
            ),
          },
        })),
      setAssumptionSidebarMode: (mode) =>
        set((state) => ({
          ui: {
            ...state.ui,
            assumptionSidebarMode: mode,
          },
        })),
      openWalkthrough: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isWalkthroughOpen: true,
            walkthroughStep: 0,
          },
        })),
      closeWalkthrough: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isWalkthroughOpen: false,
          },
        })),
      nextWalkthroughStep: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isWalkthroughOpen: true,
            walkthroughStep: Math.min(
              state.ui.walkthroughStep + 1,
              WALKTHROUGH_MAX_STEP,
            ),
          },
        })),
      previousWalkthroughStep: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isWalkthroughOpen: true,
            walkthroughStep: Math.max(state.ui.walkthroughStep - 1, 0),
          },
        })),
      goToWalkthroughStep: (step) =>
        set((state) => ({
          ui: {
            ...state.ui,
            isWalkthroughOpen: true,
            walkthroughStep: Math.max(0, Math.min(WALKTHROUGH_MAX_STEP, step)),
          },
        })),
      dismissToast: (toastId) =>
        set((state) => ({
          ui: {
            ...state.ui,
            toasts: state.ui.toasts.filter((toast) => toast.id !== toastId),
          },
        })),
      dismissAllToasts: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            toasts: [],
          },
        })),
      setAssumption: (path, value) => {
        const state = get();
        if (!(path in state.assumptions.metadataByKey) || !Number.isFinite(value)) {
          set({
            validation: {
              ...state.validation,
              assumptions: {
                isValid: false,
                issuesByKey: {
                  ...state.validation.assumptions.issuesByKey,
                  [path]: ['Invalid assumption key or value.'],
                },
                lastValidatedAt: Date.now(),
              },
            },
          });
          return;
        }

        clearTimers();
        const nextValues = {
          ...state.assumptions.currentValues,
          [path]: value,
        };
        set((current) => applyAssumptionChange(current, nextValues));

        if (state.app.hasSuccessfulCalculation) {
          debounceTimer = setTimeout(() => {
            get().calculateNow();
          }, MOCK_RECALC_DEBOUNCE_MS);
        }
      },
      setAssumptionsBatch: (values) => {
        const state = get();
        clearTimers();
        const sanitizedEntries = Object.entries(values).filter(
          (entry): entry is [string, number] => typeof entry[1] === 'number',
        );
        const nextValues: AssumptionValueMap = {
          ...state.assumptions.currentValues,
          ...Object.fromEntries(sanitizedEntries),
        };
        set((current) => applyAssumptionChange(current, nextValues));

        if (state.app.hasSuccessfulCalculation) {
          debounceTimer = setTimeout(() => {
            get().calculateNow();
          }, MOCK_RECALC_DEBOUNCE_MS);
        }
      },
      resetToBase: () => {
        clearTimers();
        set((state) => applyAssumptionChange(state, { ...state.assumptions.baseValues }));
      },
      resetGroupToBase: (groupId) => {
        clearTimers();
        set((state) => {
          const nextValues = { ...state.assumptions.currentValues };
          state.assumptions.metadata
            .filter((item) => item.groupId === groupId)
            .forEach((item) => {
              nextValues[item.key] = state.assumptions.baseValues[item.key];
            });

          return applyAssumptionChange(state, nextValues);
        });
      },
      createScenario: (name) => {
        const state = get();
        const now = Date.now();
        const nextId = generateScenarioId();
        const scenario = scenarioSchema.parse({
          id: nextId,
          name: name?.trim() || `Scenario ${state.scenarios.allIds.length}`,
          probability: 0,
          assumptionValues: assumptionsSchema.parse(state.assumptions.currentValues),
          createdAt: now,
          updatedAt: now,
          sourceScenarioId: state.app.currentScenarioId,
          isDirty: false,
          kind: 'saved',
        });
        const nextById = {
          ...state.scenarios.byId,
          [nextId]: scenario,
        };

        set((current) => ({
          app: {
            ...current.app,
            currentScenarioId: nextId,
          },
          scenarios: {
            ...current.scenarios,
            byId: nextById,
            allIds: [...current.scenarios.allIds, nextId],
          },
          ...setValidationState(current.assumptions.currentValues, nextById),
        }));

        return nextId;
      },
      markScenarioDirty: (scenarioId) => {
        const state = get();
        const targetId = scenarioId ?? state.app.currentScenarioId;
        if (!state.scenarios.byId[targetId] || targetId === BASE_SCENARIO_ID) {
          return;
        }

        set((current) => ({
          scenarios: {
            ...current.scenarios,
            dirtyIds: Array.from(new Set([...current.scenarios.dirtyIds, targetId])),
            byId: {
              ...current.scenarios.byId,
              [targetId]: {
                ...current.scenarios.byId[targetId],
                isDirty: true,
                updatedAt: Date.now(),
              },
            },
          },
        }));
      },
      saveScenario: (name) => {
        const state = get();
        const now = Date.now();
        const currentId = state.app.currentScenarioId;
        const existing =
          currentId !== BASE_SCENARIO_ID ? state.scenarios.byId[currentId] : null;
        const nextId = existing?.id ?? generateScenarioId();
        const scenario: ScenarioPayload = scenarioSchema.parse({
          id: nextId,
          name: name ?? existing?.name ?? `Scenario ${state.scenarios.allIds.length}`,
          probability: existing?.probability ?? 0,
          assumptionValues: assumptionsSchema.parse(state.assumptions.currentValues),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          sourceScenarioId: existing?.sourceScenarioId ?? currentId,
          isDirty: false,
          kind: 'saved',
        });

        const nextById = {
          ...state.scenarios.byId,
          [nextId]: scenario,
        };
        const nextAllIds = state.scenarios.allIds.includes(nextId)
          ? state.scenarios.allIds
          : [...state.scenarios.allIds, nextId];
        const dirtyIds = state.scenarios.dirtyIds.filter((id) => id !== nextId);

        set((current) => ({
          app: {
            ...current.app,
            currentScenarioId: nextId,
          },
          scenarios: {
            ...current.scenarios,
            byId: nextById,
            allIds: nextAllIds,
            dirtyIds,
          },
          ...setValidationState(current.assumptions.currentValues, nextById),
        }));

        return nextId;
      },
      duplicateScenario: (scenarioId) => {
        const state = get();
        const sourceId = scenarioId ?? state.app.currentScenarioId;
        const sourceScenario =
          state.scenarios.byId[sourceId] ??
          ({
            id: BASE_SCENARIO_ID,
            name: 'Base Reference',
            assumptionValues: state.assumptions.currentValues,
          } as ScenarioPayload);
        const now = Date.now();
        const nextId = generateScenarioId();
        const duplicated = scenarioSchema.parse({
          id: nextId,
          name: `${sourceScenario.name} Copy`,
          probability: sourceScenario.probability ?? 0,
          assumptionValues: assumptionsSchema.parse(sourceScenario.assumptionValues),
          createdAt: now,
          updatedAt: now,
          sourceScenarioId: sourceScenario.id,
          isDirty: false,
          kind: 'saved',
        });
        const nextById = {
          ...state.scenarios.byId,
          [nextId]: duplicated,
        };

        set((current) => ({
          app: {
            ...current.app,
            currentScenarioId: nextId,
          },
          assumptions: {
            ...current.assumptions,
            currentValues: duplicated.assumptionValues,
            changedKeys: getChangedAssumptionKeys(
              duplicated.assumptionValues,
              current.assumptions.baseValues,
            ),
          },
          scenarios: {
            ...current.scenarios,
            byId: nextById,
            allIds: [...current.scenarios.allIds, nextId],
            dirtyIds: current.scenarios.dirtyIds.filter((id) => id !== nextId),
          },
          ...setValidationState(duplicated.assumptionValues, nextById),
        }));

        return nextId;
      },
      renameScenario: (scenarioId, name) => {
        const nextName = name.trim();
        if (!nextName) {
          return;
        }

        set((state) => {
          const scenario = state.scenarios.byId[scenarioId];
          if (!scenario || scenario.kind === 'base') {
            return state;
          }

          const nextById = {
            ...state.scenarios.byId,
            [scenarioId]: {
              ...scenario,
              name: nextName,
              updatedAt: Date.now(),
            },
          };

          return {
            scenarios: {
              ...state.scenarios,
              byId: nextById,
            },
            ...setValidationState(state.assumptions.currentValues, nextById),
          };
        });
      },
      deleteScenario: (scenarioId) => {
        if (scenarioId === BASE_SCENARIO_ID) {
          return;
        }

        clearTimers();
        set((state) => {
          if (!state.scenarios.byId[scenarioId]) {
            return state;
          }

          const nextById = { ...state.scenarios.byId };
          delete nextById[scenarioId];
          const nextAllIds = state.scenarios.allIds.filter((id) => id !== scenarioId);
          const nextDirtyIds = state.scenarios.dirtyIds.filter((id) => id !== scenarioId);
          const nextCompareIds = state.scenarios.compareIds.filter((id) => id !== scenarioId);
          const fallbackScenario = nextById[BASE_SCENARIO_ID];
          const isCurrent = state.app.currentScenarioId === scenarioId;

          return {
            app: {
              ...state.app,
              currentScenarioId: isCurrent ? BASE_SCENARIO_ID : state.app.currentScenarioId,
              runState: isCurrent && state.app.hasSuccessfulCalculation ? 'stale' : state.app.runState,
              errorMessage: null,
            },
            assumptions: isCurrent
              ? {
                  ...state.assumptions,
                  currentValues: fallbackScenario.assumptionValues,
                  changedKeys: getChangedAssumptionKeys(
                    fallbackScenario.assumptionValues,
                    state.assumptions.baseValues,
                  ),
                }
              : state.assumptions,
            scenarios: {
              ...state.scenarios,
              byId: nextById,
              allIds: nextAllIds,
              dirtyIds: nextDirtyIds,
              compareIds: nextCompareIds,
            },
            ...setValidationState(
              isCurrent ? fallbackScenario.assumptionValues : state.assumptions.currentValues,
              nextById,
            ),
          };
        });
      },
      setScenarioProbability: (scenarioId, probability) => {
        const nextProbability = Math.max(0, Math.min(100, probability));
        set((state) => {
          const scenario = state.scenarios.byId[scenarioId];
          if (!scenario) {
            return state;
          }

          const nextById = {
            ...state.scenarios.byId,
            [scenarioId]: {
              ...scenario,
              probability: nextProbability,
              updatedAt: Date.now(),
            },
          };

          return {
            scenarios: {
              ...state.scenarios,
              byId: nextById,
            },
            ...setValidationState(state.assumptions.currentValues, nextById),
          };
        });
      },
      toggleScenarioCompare: (scenarioId) => {
        set((state) => {
          if (!state.scenarios.byId[scenarioId]) {
            return state;
          }

          const isSelected = state.scenarios.compareIds.includes(scenarioId);
          const nextCompareIds = isSelected
            ? state.scenarios.compareIds.filter((id) => id !== scenarioId)
            : [...state.scenarios.compareIds.slice(-1), scenarioId];

          return {
            scenarios: {
              ...state.scenarios,
              compareIds: nextCompareIds,
            },
          };
        });
      },
      clearScenarioCompare: () =>
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            compareIds: [],
          },
        })),
      loadScenario: (scenarioId) => {
        const state = get();
        const scenario = state.scenarios.byId[scenarioId];

        if (!scenario) {
          return;
        }

        clearTimers();
        set((current) => ({
          app: {
            ...current.app,
            currentScenarioId: scenarioId,
            runState: current.app.hasSuccessfulCalculation
              ? 'stale'
              : current.app.runState,
            errorMessage: null,
          },
          assumptions: {
            ...current.assumptions,
            currentValues: scenario.assumptionValues,
            changedKeys: getChangedAssumptionKeys(
              scenario.assumptionValues,
              current.assumptions.baseValues,
            ),
          },
          scenarios: {
            ...current.scenarios,
            dirtyIds: current.scenarios.dirtyIds.filter((id) => id !== scenarioId),
            byId: {
              ...current.scenarios.byId,
              [scenarioId]: {
                ...scenario,
                isDirty: false,
              },
            },
          },
          ...setValidationState(scenario.assumptionValues, current.scenarios.byId),
        }));

        if (state.app.hasSuccessfulCalculation) {
          debounceTimer = setTimeout(() => {
            get().calculateNow();
          }, MOCK_RECALC_DEBOUNCE_MS);
        }
      },
      calculateNow: () => {
        clearTimers();
        set((state) => {
          const nextToast = buildCalculationToast({
            id: generateToastId(),
            changedKeys: state.assumptions.changedKeys,
            metadataByKey: state.assumptions.metadataByKey,
            hasSuccessfulCalculation: state.app.hasSuccessfulCalculation,
          });

          return {
            app: {
              ...state.app,
              runState: 'running',
              errorMessage: null,
            },
            ui: {
              ...state.ui,
              toasts: [nextToast, ...state.ui.toasts].slice(0, 6),
            },
            outputs: {
              ...state.outputs,
              results: state.app.hasSuccessfulCalculation
                ? state.outputs.results ?? state.outputs.lastSuccessfulResults
                : null,
              workbook: state.app.hasSuccessfulCalculation
                ? state.outputs.workbook ?? state.outputs.lastSuccessfulWorkbook
                : null,
              integrated: state.app.hasSuccessfulCalculation
                ? state.outputs.integrated ?? state.outputs.lastSuccessfulIntegrated
                : null,
            },
          };
        });

        calculationTimer = setTimeout(() => {
          const state = get();
          const snapshot = state.assumptions.currentValues;
          const shouldError = snapshot['integrated.overrides.error_trigger_flag'] > 0;

          if (shouldError) {
            set((current) => ({
              app: {
                ...current.app,
                runState: 'error',
                errorMessage:
                  'Workbook calculation failed because the Error trigger assumption is above zero.',
              },
              outputs: {
                ...current.outputs,
                results: current.outputs.lastSuccessfulResults,
                workbook: current.outputs.lastSuccessfulWorkbook,
                integrated: current.outputs.lastSuccessfulIntegrated,
              },
            }));
            return;
          }

          const workbook = runA2FleetWorkbook(snapshot);
          const integrated = runIntegratedModel(snapshot, workbook);
          const results = buildA2FleetOutputCards(workbook);
          set((current) => ({
            app: {
              ...current.app,
              runState: 'ready',
              errorMessage: null,
              hasSuccessfulCalculation: true,
              lastCalculatedAt: Date.now(),
            },
            outputs: {
              results,
              lastSuccessfulResults: results,
              previousResults: current.outputs.lastSuccessfulResults,
              workbook,
              lastSuccessfulWorkbook: workbook,
              previousWorkbook: current.outputs.lastSuccessfulWorkbook,
              integrated,
              lastSuccessfulIntegrated: integrated,
              previousIntegrated: current.outputs.lastSuccessfulIntegrated,
            },
          }));
        }, MOCK_CALCULATION_DELAY_MS);
      },
      selectAssumption: (key) =>
        set((state) => ({
          ui: {
            ...state.ui,
            selectedAssumptionKey: key,
          },
        })),
      selectKpi: (id) =>
        set((state) => ({
          ui: {
            ...state.ui,
            selectedKpiId: id,
          },
        })),
      resetStore: () => {
        clearTimers();
        scenarioCounter = 1;
        toastCounter = 1;
        set(buildInitialState());
      },
    }),
    {
      name: 'a2-shell-store',
      partialize: (state) => ({
        ui: {
          theme: state.ui.theme,
          displayCurrency: state.ui.displayCurrency,
          isPrimarySidebarOpen: state.ui.isPrimarySidebarOpen,
          isAssumptionsOpen: state.ui.isAssumptionsOpen,
          isUtilityPanelOpen: state.ui.isUtilityPanelOpen,
          assumptionsSidebarWidth: state.ui.assumptionsSidebarWidth,
          assumptionSidebarMode: state.ui.assumptionSidebarMode,
        },
      }),
      merge: (persisted, current) => {
        const persistedState =
          (persisted as Partial<AppStoreState> | undefined) ?? undefined;
        const merged = {
          ...current,
          ...(persistedState ?? {}),
        } as AppStoreState;

        return {
          ...merged,
          assumptions: {
            ...current.assumptions,
            ...merged.assumptions,
          },
          ui: {
            ...current.ui,
            ...merged.ui,
            displayCurrency: sanitizeDisplayCurrency(merged.ui?.displayCurrency),
            assumptionSidebarMode: sanitizeAssumptionSidebarMode(
              merged.ui?.assumptionSidebarMode,
            ),
            assumptionsSidebarWidth: Math.max(
              ASSUMPTIONS_SIDEBAR_WIDTH.min,
              Math.min(
                ASSUMPTIONS_SIDEBAR_WIDTH.max,
                merged.ui?.assumptionsSidebarWidth ?? current.ui.assumptionsSidebarWidth,
              ),
            ),
          },
        };
      },
    },
  ),
);

export function resetAppStore() {
  clearTimers();
  scenarioCounter = 1;
  toastCounter = 1;
  useAppStore.setState(buildInitialState());
}

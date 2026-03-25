import {
  MOCK_CALCULATION_DELAY_MS,
  MOCK_RECALC_DEBOUNCE_MS,
  resetAppStore,
  type RunState,
  useAppStore,
} from './appStore';

export { MOCK_CALCULATION_DELAY_MS, MOCK_RECALC_DEBOUNCE_MS, type RunState };

type ModelStoreFacade = {
  assumptions: Record<string, number>;
  runState: RunState;
  results: ReturnType<typeof useAppStore.getState>['outputs']['results'];
  lastSuccessfulResults: ReturnType<
    typeof useAppStore.getState
  >['outputs']['lastSuccessfulResults'];
  previousResults: ReturnType<typeof useAppStore.getState>['outputs']['previousResults'];
  workbook: ReturnType<typeof useAppStore.getState>['outputs']['workbook'];
  lastSuccessfulWorkbook: ReturnType<
    typeof useAppStore.getState
  >['outputs']['lastSuccessfulWorkbook'];
  previousWorkbook: ReturnType<
    typeof useAppStore.getState
  >['outputs']['previousWorkbook'];
  integrated: ReturnType<typeof useAppStore.getState>['outputs']['integrated'];
  lastSuccessfulIntegrated: ReturnType<
    typeof useAppStore.getState
  >['outputs']['lastSuccessfulIntegrated'];
  previousIntegrated: ReturnType<
    typeof useAppStore.getState
  >['outputs']['previousIntegrated'];
  scenarios: ReturnType<typeof useAppStore.getState>['scenarios'];
  hasSuccessfulCalculation: boolean;
  errorMessage: string | null;
  lastCalculatedAt: number | null;
  changedAssumptionIds: string[];
  selectedAssumptionKey: string | null;
  selectedKpiId: string | null;
  setAssumptionValue: (id: string, value: number) => void;
  calculateNow: () => void;
  loadScenario: (scenarioId: string) => void;
  toggleScenarioCompare: (scenarioId: string) => void;
  clearScenarioCompare: () => void;
  setScenarioProbability: (scenarioId: string, probability: number) => void;
  selectAssumption: (key: string | null) => void;
  selectKpi: (id: string | null) => void;
};

export function useModelStore<T>(selector: (state: ModelStoreFacade) => T) {
  return useAppStore((state) =>
    selector({
      assumptions: state.assumptions.currentValues,
      runState: state.app.runState,
      results: state.outputs.results,
      lastSuccessfulResults: state.outputs.lastSuccessfulResults,
      previousResults: state.outputs.previousResults,
      workbook: state.outputs.workbook,
      lastSuccessfulWorkbook: state.outputs.lastSuccessfulWorkbook,
      previousWorkbook: state.outputs.previousWorkbook,
      integrated: state.outputs.integrated,
      lastSuccessfulIntegrated: state.outputs.lastSuccessfulIntegrated,
      previousIntegrated: state.outputs.previousIntegrated,
      scenarios: state.scenarios,
      hasSuccessfulCalculation: state.app.hasSuccessfulCalculation,
      errorMessage: state.app.errorMessage,
      lastCalculatedAt: state.app.lastCalculatedAt,
      changedAssumptionIds: state.assumptions.changedKeys,
      selectedAssumptionKey: state.ui.selectedAssumptionKey,
      selectedKpiId: state.ui.selectedKpiId,
      setAssumptionValue: state.setAssumption,
      calculateNow: state.calculateNow,
      loadScenario: state.loadScenario,
      toggleScenarioCompare: state.toggleScenarioCompare,
      clearScenarioCompare: state.clearScenarioCompare,
      setScenarioProbability: state.setScenarioProbability,
      selectAssumption: state.selectAssumption,
      selectKpi: state.selectKpi,
    }),
  );
}

export function resetModelStore() {
  resetAppStore();
}

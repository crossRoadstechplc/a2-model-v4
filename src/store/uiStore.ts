import {
  useAppStore,
  type ThemeMode,
} from './appStore';
import type { AssumptionSidebarMode } from '../model/assumptions';
import type { DisplayCurrency } from '../model/displayCurrency';

export const uiDefaults: {
  theme: ThemeMode;
  displayCurrency: DisplayCurrency;
  isPrimarySidebarOpen: boolean;
  isAssumptionsOpen: boolean;
  isUtilityPanelOpen: boolean;
  assumptionsSidebarWidth: number;
  assumptionSidebarMode: AssumptionSidebarMode;
} = {
  theme: 'light',
  displayCurrency: 'USD',
  isPrimarySidebarOpen: true,
  isAssumptionsOpen: true,
  isUtilityPanelOpen: false,
  assumptionsSidebarWidth: 360,
  assumptionSidebarMode: 'context',
};

type UIStoreFacade = typeof uiDefaults & {
  isWalkthroughOpen: boolean;
  walkthroughStep: number;
  toasts: ReturnType<typeof useAppStore.getState>['ui']['toasts'];
  setTheme: (theme: ThemeMode) => void;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  toggleTheme: () => void;
  togglePrimarySidebar: () => void;
  toggleAssumptions: () => void;
  toggleUtilityPanel: () => void;
  setAssumptionsSidebarWidth: (width: number) => void;
  setAssumptionSidebarMode: (
    mode: UIStoreFacade['assumptionSidebarMode'],
  ) => void;
  openWalkthrough: () => void;
  closeWalkthrough: () => void;
  nextWalkthroughStep: () => void;
  previousWalkthroughStep: () => void;
  goToWalkthroughStep: (step: number) => void;
  dismissToast: (toastId: string) => void;
  dismissAllToasts: () => void;
};

export function useUIStore<T>(selector: (state: UIStoreFacade) => T) {
  return useAppStore((state) =>
    selector({
      ...state.ui,
      setTheme: state.setTheme,
      setDisplayCurrency: state.setDisplayCurrency,
      toggleTheme: state.toggleTheme,
      togglePrimarySidebar: state.togglePrimarySidebar,
      toggleAssumptions: state.toggleAssumptions,
      toggleUtilityPanel: state.toggleUtilityPanel,
      setAssumptionsSidebarWidth: state.setAssumptionsSidebarWidth,
      setAssumptionSidebarMode: state.setAssumptionSidebarMode,
      openWalkthrough: state.openWalkthrough,
      closeWalkthrough: state.closeWalkthrough,
      nextWalkthroughStep: state.nextWalkthroughStep,
      previousWalkthroughStep: state.previousWalkthroughStep,
      goToWalkthroughStep: state.goToWalkthroughStep,
      dismissToast: state.dismissToast,
      dismissAllToasts: state.dismissAllToasts,
    }),
  );
}

export function resetUIStore() {
  useAppStore.getState().resetStore();
}

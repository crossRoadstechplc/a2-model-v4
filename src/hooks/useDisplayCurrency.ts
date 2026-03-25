import { DISPLAY_CURRENCY_FX_KEY } from '../model/displayCurrency';
import { useAppStore } from '../store/appStore';

export function useDisplayCurrency() {
  const displayCurrency = useAppStore((state) => state.ui.displayCurrency);
  const fxRate = useAppStore(
    (state) =>
      state.assumptions.currentValues[DISPLAY_CURRENCY_FX_KEY] ??
      state.assumptions.baseValues[DISPLAY_CURRENCY_FX_KEY] ??
      1,
  );

  return {
    displayCurrency,
    fxRate,
  };
}

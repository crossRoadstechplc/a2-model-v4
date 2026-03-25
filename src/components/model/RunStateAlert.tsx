import { useModelStore } from '../../store/modelStore';
import { AlertBanner } from '../ui/AlertBanner';

export function RunStateAlert() {
  const runState = useModelStore((state) => state.runState);
  const hasSuccessfulCalculation = useModelStore(
    (state) => state.hasSuccessfulCalculation,
  );
  const errorMessage = useModelStore((state) => state.errorMessage);

  if (runState === 'ready') {
    return (
      <AlertBanner
        title="Workbook outputs are current"
        message="Results shown below reflect the latest successful A2 Fleet workbook replication run."
      />
    );
  }

  if (runState === 'stale') {
    return (
      <AlertBanner
        title="Outputs are stale"
        message="Assumptions changed after the last successful run. Existing outputs remain visible while automatic recalculation is queued."
        tone="warning"
      />
    );
  }

  if (runState === 'running' && hasSuccessfulCalculation) {
    return (
      <AlertBanner
        title="Refreshing outputs"
        message="A workbook recalculation is in progress. Previous results stay visible until the refresh finishes."
      />
    );
  }

  if (runState === 'error') {
    return (
      <AlertBanner
        title="Calculation error"
        message={
          errorMessage ??
          'The workbook calculation failed. Existing successful outputs remain visible until a retry succeeds.'
        }
        tone="warning"
      />
    );
  }

  return null;
}

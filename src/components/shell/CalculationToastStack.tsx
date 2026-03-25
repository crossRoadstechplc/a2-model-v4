import { useUIStore } from '../../store/uiStore';
import { IconButton } from '../ui/IconButton';
import { CloseIcon } from '../ui/icons';

export function CalculationToastStack() {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);
  const dismissAllToasts = useUIStore((state) => state.dismissAllToasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-6 top-24 z-40 flex w-[24rem] max-w-[calc(100vw-2rem)] flex-col gap-3"
      data-testid="calculation-toast-stack"
    >
      {toasts.length > 1 ? (
        <div className="pointer-events-auto flex justify-end">
          <button
            type="button"
            title="Dismiss all calculation notifications"
            onClick={dismissAllToasts}
            className="rounded-full border border-app-border bg-app-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle transition hover:text-app-text"
            data-testid="dismiss-all-toasts"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl border border-app-border bg-app-panel shadow-panel"
          data-testid={`calculation-toast-${toast.id}`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-app-border px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                {toast.kind === 'initial' ? 'Model run' : 'Recalculation'}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-app-text">{toast.title}</h3>
            </div>
            <IconButton
              icon={<CloseIcon className="h-4 w-4" />}
              label="Dismiss calculation notification"
              onClick={() => dismissToast(toast.id)}
              className="h-8 w-8 rounded-lg"
              testId={`dismiss-toast-${toast.id}`}
            />
          </div>
          <div className="space-y-3 px-4 py-3">
            <p className="text-sm leading-6 text-app-subtle">{toast.message}</p>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-subtle">
                Affected areas
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {toast.impactedAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-app-border bg-app-bg px-2.5 py-1 text-xs font-medium text-app-text"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

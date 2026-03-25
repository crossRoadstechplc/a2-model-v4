import { AlertBanner } from '../ui/AlertBanner';
import { StatusBadge } from '../ui/StatusBadge';
import type { IntegrityMessage } from './a2FleetViewModel';

type A2FleetIntegrityPanelProps = {
  messages: IntegrityMessage[];
  dataTestId?: string;
};

export function A2FleetIntegrityPanel({
  messages,
  dataTestId = 'a2-fleet-integrity',
}: A2FleetIntegrityPanelProps) {
  return (
    <div className="grid gap-4" data-testid={dataTestId}>
      {messages.map((message) => (
        <div
          key={message.id}
          className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-app-text">{message.title}</h3>
            <StatusBadge tone={message.severity === 'warning' ? 'warning' : 'neutral'}>
              {message.severity === 'warning' ? 'Attention' : 'Check'}
            </StatusBadge>
          </div>
          <div className="mt-3">
            <AlertBanner
              title={message.title}
              message={message.message}
              tone={message.severity}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

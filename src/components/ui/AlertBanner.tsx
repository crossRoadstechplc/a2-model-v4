import { cn } from '../../lib/cn';

type AlertBannerProps = {
  title: string;
  message: string;
  tone?: 'info' | 'warning';
};

const toneClasses: Record<NonNullable<AlertBannerProps['tone']>, string> = {
  info: 'border-app-accent/20 bg-app-accentSoft/70 text-app-text',
  warning: 'border-app-warning/25 bg-app-warning/10 text-app-text',
};

export function AlertBanner({
  title,
  message,
  tone = 'info',
}: AlertBannerProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 shadow-sm',
        toneClasses[tone],
      )}
      role="status"
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-app-subtle">{message}</p>
    </div>
  );
}

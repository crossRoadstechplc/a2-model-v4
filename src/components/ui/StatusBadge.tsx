import { cn } from '../../lib/cn';

type StatusBadgeProps = {
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
  children: React.ReactNode;
};

const toneClasses: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  neutral:
    'border-app-border bg-app-muted/60 text-app-subtle dark:bg-app-muted/40',
  accent: 'border-app-accent/20 bg-app-accentSoft text-app-accent',
  success: 'border-app-success/20 bg-app-success/10 text-app-success',
  warning: 'border-app-warning/20 bg-app-warning/10 text-app-warning',
};

export function StatusBadge({
  tone = 'neutral',
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

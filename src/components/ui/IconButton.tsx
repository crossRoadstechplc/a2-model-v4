import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  active?: boolean;
  testId?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-expanded'?: boolean;
};

export function IconButton({
  icon,
  label,
  onClick,
  className,
  disabled,
  active = false,
  testId,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-testid={testId}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-app-border bg-app-panel text-app-subtle transition hover:border-app-accent/35 hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/20 disabled:cursor-not-allowed disabled:opacity-50',
        active && 'border-app-accent/25 bg-app-accentSoft text-app-accent',
        className,
      )}
      {...rest}
    >
      <span className="h-5 w-5">{icon}</span>
    </button>
  );
}

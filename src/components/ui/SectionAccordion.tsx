import { useState } from 'react';
import { cn } from '../../lib/cn';
import { ChevronRightIcon } from './icons';

type SectionAccordionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  meta?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionAccordion({
  title,
  description,
  defaultOpen = true,
  meta,
  children,
}: SectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-app-border bg-app-panel shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-app-text">{title}</h3>
            {meta}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-app-subtle">{description}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-app-border text-app-subtle transition-transform',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </span>
      </button>
      {isOpen ? (
        <div className="border-t border-app-border px-4 py-4">{children}</div>
      ) : null}
    </section>
  );
}

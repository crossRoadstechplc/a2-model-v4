type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel = 'Calculation engine pending',
}: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-app-border bg-app-panel p-8 shadow-panel">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
          Analytical Workspace
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-app-text">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-app-subtle">{description}</p>
        <div className="mt-6 inline-flex items-center rounded-xl border border-app-border bg-app-muted/50 px-4 py-2 text-sm font-medium text-app-text">
          {actionLabel}
        </div>
      </div>
    </section>
  );
}

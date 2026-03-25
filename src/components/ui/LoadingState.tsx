type LoadingStateProps = {
  title: string;
  description: string;
};

export function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
      <div className="animate-pulse">
        <div className="h-3 w-28 rounded-full bg-app-muted" />
        <div className="mt-4 h-6 w-56 rounded-full bg-app-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-app-muted" />
        <div className="mt-2 h-4 w-4/5 rounded-full bg-app-muted" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="h-24 rounded-2xl bg-app-muted" />
          <div className="h-24 rounded-2xl bg-app-muted" />
          <div className="h-24 rounded-2xl bg-app-muted" />
        </div>
      </div>
      <div className="mt-5">
        <h3 className="text-base font-semibold text-app-text">{title}</h3>
        <p className="mt-2 text-sm text-app-subtle">{description}</p>
      </div>
    </section>
  );
}

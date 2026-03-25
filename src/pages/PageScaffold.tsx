import { AlertBanner } from '../components/ui/AlertBanner';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionAccordion } from '../components/ui/SectionAccordion';
import { StatusBadge } from '../components/ui/StatusBadge';

type PageScaffoldProps = {
  title: string;
  intro: string;
  emptyState?: boolean;
  loadingState?: boolean;
  sections: Array<{
    title: string;
    description: string;
    body: string;
  }>;
};

export function PageScaffold({
  title,
  intro,
  emptyState = false,
  loadingState = false,
  sections,
}: PageScaffoldProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Placeholder Page
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">{intro}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">Shell ready</StatusBadge>
            <StatusBadge tone="neutral">No calculations yet</StatusBadge>
          </div>
        </div>
      </section>

      <AlertBanner
        title="Documentation-first mode"
        message="Reference files in /Docs remain documentation inputs only. This shell intentionally avoids model calculations and output wiring."
      />

      {emptyState ? (
        <EmptyState
          title="Run assumptions and analytical calculations to populate this workspace"
          description="The desktop shell is ready for dashboards, charts, and financial outputs. Until the engine is connected, this area stays in a clean pre-calculation state."
        />
      ) : null}

      {loadingState ? (
        <LoadingState
          title="Dependent workflows are intentionally stubbed"
          description="Export, simulation, or scenario execution surfaces can reuse this loading shell once background jobs are introduced."
        />
      ) : null}

      <div className="grid gap-4">
        {sections.map((section) => (
          <SectionAccordion
            key={section.title}
            title={section.title}
            description={section.description}
          >
            <div className="rounded-2xl bg-app-muted/45 p-4 text-sm leading-6 text-app-subtle">
              {section.body}
            </div>
          </SectionAccordion>
        ))}
      </div>
    </div>
  );
}

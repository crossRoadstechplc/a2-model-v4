import { MockOutputCards } from './MockOutputCards';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';

type DashboardPageProps = {
  title: string;
  intro: string;
  outputTitle: string;
  outputDescription: string;
  sections: Array<{
    title: string;
    description: string;
    body: string;
  }>;
};

export function DashboardPage({
  title,
  intro,
  outputTitle,
  outputDescription,
  sections,
}: DashboardPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Analytical Module
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">{intro}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">Investor grade</StatusBadge>
            <StatusBadge tone="neutral">V2 workbook</StatusBadge>
          </div>
        </div>
      </section>

      <MockOutputCards title={outputTitle} description={outputDescription} />

      <div className="grid gap-4">
        {sections.map((section) => (
          <SectionAccordion
            key={section.title}
            title={section.title}
            description={section.description}
            defaultOpen
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

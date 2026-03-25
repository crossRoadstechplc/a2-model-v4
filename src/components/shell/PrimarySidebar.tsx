import { NavLink } from 'react-router-dom';
import { navigationSections } from '../../app/navigation';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/uiStore';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons';
import { IconButton } from '../ui/IconButton';
import { StatusBadge } from '../ui/StatusBadge';

export function PrimarySidebar() {
  const isOpen = useUIStore((state) => state.isPrimarySidebarOpen);
  const togglePrimarySidebar = useUIStore((state) => state.togglePrimarySidebar);

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r border-app-border bg-app-panel transition-[width] duration-300 lg:flex lg:flex-col lg:overflow-hidden',
        isOpen ? 'w-[17.5rem]' : 'w-[5.25rem]',
      )}
      data-testid="primary-sidebar"
      data-state={isOpen ? 'open' : 'closed'}
    >
      <div
        className={cn(
          'flex items-start border-b border-app-border px-4 py-4',
          isOpen ? 'justify-between gap-3' : 'justify-center',
        )}
      >
        {isOpen ? (
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <img
                src="/logo.png"
                alt="A2 Model logo"
                className="h-14 w-14 shrink-0 rounded-[1.35rem] border border-app-border bg-white object-contain p-1.5 shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
                  A2 Model
                </p>
                <h1 className="mt-2 text-lg font-semibold text-app-text">
                  Feasibility Planner
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-app-subtle">
              Institutional workspace for feasibility and planning review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <img
              src="/logo.png"
              alt="A2 Model logo"
              className="h-12 w-12 rounded-[1.35rem] border border-app-border bg-white object-contain p-1.5 shadow-sm"
            />
          </div>
        )}

        <IconButton
          icon={
            isOpen ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )
          }
          label={isOpen ? 'Collapse primary navigation' : 'Expand primary navigation'}
          onClick={togglePrimarySidebar}
          active={isOpen}
          testId="primary-sidebar-toggle"
          aria-expanded={isOpen}
        />
      </div>

      <nav
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4"
        aria-label="Primary navigation"
        data-testid="primary-sidebar-scroll"
      >
        <div className="space-y-4">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {isOpen ? (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-app-subtle">
                  {section.title}
                </p>
              ) : null}

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  aria-label={item.label}
                  title={item.label}
                  data-testid={`nav-link-${
                    item.path === '/' ? 'executive-summary' : item.path.slice(1)
                  }`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-2xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-app-accent/20',
                      isOpen
                        ? 'gap-3 px-3 py-3'
                        : 'justify-center px-0 py-3',
                      isActive
                        ? 'bg-app-accentSoft text-app-accent'
                        : 'text-app-subtle hover:bg-app-muted/70 hover:text-app-text',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                          isActive
                            ? 'border-app-accent/20 bg-app-panel text-app-accent'
                            : 'border-app-border bg-app-panel text-app-subtle',
                        )}
                      >
                        {item.icon}
                      </span>
                      {isOpen ? (
                        <span className="min-w-0 leading-5">{item.label}</span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <div
        className={cn(
          'border-t border-app-border px-4 py-4',
          isOpen ? 'flex justify-start' : 'flex justify-center',
        )}
      >
        {isOpen ? (
          <StatusBadge tone="accent">Planning shell</StatusBadge>
        ) : (
          <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-app-border bg-app-bg text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle"
            title="Planning shell"
            aria-label="Planning shell"
          >
            PS
          </div>
        )}
      </div>
    </aside>
  );
}

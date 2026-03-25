import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { cn } from '../../lib/cn';
import { ASSUMPTIONS_SIDEBAR_WIDTH } from '../../store/appStore';
import { useUIStore } from '../../store/uiStore';
import { useModelStore } from '../../store/modelStore';
import { AssumptionsEditor } from '../assumptions/AssumptionsEditor';
import { ChevronLeftIcon, ChevronRightIcon, SlidersIcon } from '../ui/icons';
import { IconButton } from '../ui/IconButton';
import { StatusBadge } from '../ui/StatusBadge';

export function AssumptionsSidebar() {
  const isOpen = useUIStore((state) => state.isAssumptionsOpen);
  const width = useUIStore((state) => state.assumptionsSidebarWidth);
  const setAssumptionsSidebarWidth = useUIStore(
    (state) => state.setAssumptionsSidebarWidth,
  );
  const toggleAssumptions = useUIStore((state) => state.toggleAssumptions);
  const changedAssumptionIds = useModelStore((state) => state.changedAssumptionIds);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current) {
        return;
      }

      const nextWidth =
        dragStateRef.current.startWidth + (event.clientX - dragStateRef.current.startX);
      setAssumptionsSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, setAssumptionsSidebarWidth]);

  const startResize = (event: ReactMouseEvent<HTMLButtonElement>) => {
    dragStateRef.current = {
      startX: event.clientX,
      startWidth: width,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <aside
      className={cn(
        'relative hidden shrink-0 border-r border-app-border bg-app-panel transition-[width] duration-300 lg:flex lg:flex-col lg:overflow-hidden',
        isOpen ? '' : 'w-[4.75rem]',
      )}
      style={isOpen ? { width: `${width}px` } : undefined}
      data-testid="assumptions-sidebar"
      data-state={isOpen ? 'open' : 'closed'}
      data-width={isOpen ? width : 76}
    >
      <div
        className={cn(
          'flex items-start border-b border-app-border px-4 py-4',
          isOpen ? 'justify-between gap-3' : 'justify-center',
        )}
      >
        {isOpen ? (
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Assumptions
            </p>
            <h2 className="mt-1 text-base font-semibold text-app-text">
              Working input groups
            </h2>
          </div>
        ) : (
          <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-app-border bg-app-bg text-app-subtle"
            title="Assumptions"
            aria-label="Assumptions"
          >
            <SlidersIcon className="h-5 w-5" />
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
          label={isOpen ? 'Collapse assumptions sidebar' : 'Expand assumptions sidebar'}
          onClick={toggleAssumptions}
          active={isOpen}
          testId="assumptions-toggle"
          aria-expanded={isOpen}
        />
      </div>

      {isOpen ? (
        <>
          <div
            className="flex items-center gap-2 border-b border-app-border px-4 py-3"
            data-testid="assumptions-sidebar-summary"
          >
            <StatusBadge tone="neutral">Quick edit</StatusBadge>
            <StatusBadge
              tone={changedAssumptionIds.length > 0 ? 'warning' : 'neutral'}
            >
              {changedAssumptionIds.length} changed
            </StatusBadge>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
            data-testid="assumptions-sidebar-scroll"
          >
            <AssumptionsEditor context="sidebar" />
          </div>
          <button
            type="button"
            className="absolute inset-y-0 right-0 hidden w-2 -translate-x-1/2 cursor-col-resize border-l border-transparent bg-transparent hover:border-app-accent/40 lg:block"
            onMouseDown={startResize}
            aria-label="Resize assumptions sidebar"
            title={`Resize assumptions sidebar (${ASSUMPTIONS_SIDEBAR_WIDTH.min}-${ASSUMPTIONS_SIDEBAR_WIDTH.max}px)`}
            data-testid="assumptions-resize-handle"
          />
        </>
      ) : null}
    </aside>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { walkthroughSteps } from '../../app/walkthroughContent';
import { useUIStore } from '../../store/uiStore';
import { IconButton } from '../ui/IconButton';
import { CloseIcon } from '../ui/icons';

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type WalkthroughCardPosition = {
  bottom?: string;
  left?: string;
  right?: string;
  width: string;
};

function buildFallbackRect(): SpotlightRect {
  return {
    top: window.innerHeight * 0.18,
    left: window.innerWidth * 0.18,
    width: window.innerWidth * 0.64,
    height: window.innerHeight * 0.46,
  };
}

export function AppWalkthrough() {
  const isOpen = useUIStore((state) => state.isWalkthroughOpen);
  const step = useUIStore((state) => state.walkthroughStep);
  const isUtilityPanelOpen = useUIStore((state) => state.isUtilityPanelOpen);
  const toggleUtilityPanel = useUIStore((state) => state.toggleUtilityPanel);
  const closeWalkthrough = useUIStore((state) => state.closeWalkthrough);
  const nextWalkthroughStep = useUIStore((state) => state.nextWalkthroughStep);
  const previousWalkthroughStep = useUIStore((state) => state.previousWalkthroughStep);
  const goToWalkthroughStep = useUIStore((state) => state.goToWalkthroughStep);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [isStepVisible, setIsStepVisible] = useState(false);

  const currentStep = walkthroughSteps[step] ?? walkthroughSteps[0];
  const isFirst = step === 0;
  const isLast = step === walkthroughSteps.length - 1;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const updateSpotlight = () => {
      const element = document.querySelector(currentStep.selector) as HTMLElement | null;

      if (!element) {
        setSpotlightRect(buildFallbackRect());
        return;
      }

      const rect = element.getBoundingClientRect();
      const padding = 10;
      setSpotlightRect({
        top: Math.max(12, rect.top - padding),
        left: Math.max(12, rect.left - padding),
        width: Math.min(window.innerWidth - 24, rect.width + padding * 2),
        height: Math.min(window.innerHeight - 24, rect.height + padding * 2),
      });
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [currentStep.selector, isOpen, isUtilityPanelOpen, step]);

  useEffect(() => {
    if (
      isOpen &&
      currentStep.selector === '[data-testid="utility-panel"]' &&
      !isUtilityPanelOpen
    ) {
      toggleUtilityPanel();
    }
  }, [currentStep.selector, isOpen, isUtilityPanelOpen, toggleUtilityPanel]);

  useEffect(() => {
    if (!isOpen) {
      setIsStepVisible(false);
      return undefined;
    }

    setIsStepVisible(false);
    const frame = window.requestAnimationFrame(() => {
      setIsStepVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen, step]);

  const spotlightStyle = useMemo(() => {
    if (!spotlightRect) {
      return undefined;
    }

    return {
      top: `${spotlightRect.top}px`,
      left: `${spotlightRect.left}px`,
      width: `${spotlightRect.width}px`,
      height: `${spotlightRect.height}px`,
      boxShadow: '0 0 0 9999px rgba(10, 19, 34, 0.56)',
    };
  }, [spotlightRect]);

  const cardStyle = useMemo<WalkthroughCardPosition | undefined>(() => {
    if (!spotlightRect) {
      return {
        right: '1.5rem',
        bottom: '1.5rem',
        width: 'min(23rem, calc(100vw - 2rem))',
      };
    }

    const viewportWidth = window.innerWidth;
    const preferredWidth = Math.min(380, Math.max(318, viewportWidth * 0.245));
    const gutter = 24;
    const spotlightMidpoint = spotlightRect.left + spotlightRect.width / 2;
    const anchorRight = spotlightMidpoint < viewportWidth * 0.58;

    if (anchorRight) {
      return {
        right: `${gutter}px`,
        bottom: `${gutter}px`,
        width: `${preferredWidth}px`,
      };
    }

    return {
      left: `${gutter}px`,
      bottom: `${gutter}px`,
      width: `${preferredWidth}px`,
    };
  }, [spotlightRect]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" data-testid="app-walkthrough">
      <div className="absolute inset-0 bg-slate-950/20" />
      {spotlightStyle ? (
        <div
          className="pointer-events-none absolute rounded-[1.5rem] border border-app-accent/70 bg-white/5 ring-1 ring-white/20 transition-all duration-500 ease-out"
          style={spotlightStyle}
          data-testid="walkthrough-spotlight"
        />
      ) : null}

      <div className="relative h-full w-full">
        <div
          className="absolute overflow-hidden rounded-[1.75rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,249,253,0.94))] shadow-[0_24px_80px_rgba(10,19,34,0.24)] backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(15,23,42,0.94))]"
          style={cardStyle}
          data-testid="walkthrough-card"
        >
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,rgba(36,100,190,0.22),rgba(36,100,190,0.72),rgba(36,100,190,0.22))]" />

          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-app-accent/20 bg-app-accentSoft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-app-accent">
                  Guided tour
                </span>
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-app-subtle"
                  data-testid="walkthrough-progress"
                >
                  Step {step + 1} of {walkthroughSteps.length}
                </span>
              </div>
              <h2 className="mt-3 text-[1.15rem] font-semibold leading-7 text-app-text">
                {currentStep.title}
              </h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-app-accent">
                {currentStep.sectionLabel}
              </p>
            </div>
            <IconButton
              icon={<CloseIcon className="h-5 w-5" />}
              label="Close walkthrough"
              onClick={closeWalkthrough}
              className="h-9 w-9 rounded-full border-white/50 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
              testId="walkthrough-close"
            />
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-[1.35rem] border border-white/55 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-white/10 dark:bg-slate-900/55">
              <p className="text-sm leading-6 text-app-subtle">
                {currentStep.summary}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {walkthroughSteps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  title={`Open walkthrough step ${index + 1}: ${item.title}`}
                  onClick={() => goToWalkthroughStep(index)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    index === step
                      ? 'border-app-accent bg-app-accent text-white shadow-sm'
                      : 'border-app-border/80 bg-white/70 text-app-subtle hover:border-app-accent/30 hover:text-app-text dark:bg-slate-900/55'
                  }`}
                  data-testid={`walkthrough-step-${index}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div
              key={step}
              className={`mt-4 transition-all duration-500 ease-out ${
                isStepVisible
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'translate-y-3 scale-[0.985] opacity-0'
              }`}
              data-testid="walkthrough-content"
            >
              <div className="rounded-[1.45rem] border border-white/55 bg-white/76 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-white/10 dark:bg-slate-900/55">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-app-subtle">
                  What to notice
                </p>
                <div className="mt-3 space-y-3">
                  {currentStep.details.map((detail, index) => (
                    <div key={detail} className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-app-accent" />
                      <p className="text-sm leading-6 text-app-subtle">
                        <span className="mr-1 font-semibold text-app-text">
                          {index + 1}.
                        </span>
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                title="Close walkthrough"
                onClick={closeWalkthrough}
                className="rounded-xl border border-app-border/80 bg-white/72 px-4 py-2 text-sm font-semibold text-app-subtle transition hover:border-app-accent/30 hover:text-app-text dark:bg-slate-900/55"
              >
                Close
              </button>
              <button
                type="button"
                title="Go to previous walkthrough step"
                onClick={previousWalkthroughStep}
                disabled={isFirst}
                className="rounded-xl border border-app-border/80 bg-white/72 px-4 py-2 text-sm font-semibold text-app-subtle transition hover:border-app-accent/30 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/55"
              >
                Back
              </button>
              <button
                type="button"
                title={isLast ? 'Finish walkthrough' : 'Go to next walkthrough step'}
                onClick={isLast ? closeWalkthrough : nextWalkthroughStep}
                className="rounded-xl border border-app-accent bg-app-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                data-testid="walkthrough-next"
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

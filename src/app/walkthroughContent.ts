export const walkthroughSteps = [
  {
    title: 'Primary navigation',
    selector: '[data-testid="primary-sidebar"]',
    sectionLabel: 'Navigation shell',
    summary:
      'This left rail is the app map. It groups overview pages, entity modules, analysis tools, and reporting surfaces into one institutional navigation spine.',
    details: [
      'Use it as the fastest way to move between executive review, entity dashboards, planning tools, and audit pages without losing the assumptions or utility context on screen.',
      'The sidebar is structured like a serious modeling workspace rather than a generic website menu, so the most important working routes stay close together and visually disciplined.',
      'Collapsed mode preserves icons, active state, and hover titles, which keeps orientation intact when you need more room for tables or dashboards.',
    ],
  },
  {
    title: 'Entity and analysis tabs',
    selector: '[data-testid="nav-link-a2-fleet"]',
    sectionLabel: 'Module navigation',
    summary:
      'The most-used working routes start here: Fleet, Platform, Energy, corridor consolidation, and the planning or audit surfaces beneath them.',
    details: [
      'A2 Fleet is the workbook-anchored baseline, while Platform, Energy, and Consolidated extend that baseline into the broader integrated model structure.',
      'Scenario Studio, Sensitivity Lab, Integrity Checks, and Validation Report are grouped alongside the entity pages because they inspect or manipulate the same shared model state.',
      'Think of the navigation as changing the analytical lens on one model, not jumping between disconnected applications.',
    ],
  },
  {
    title: 'Assumptions rail',
    selector: '[data-testid="assumptions-sidebar"]',
    sectionLabel: 'Quick-edit inputs',
    summary:
      'This persistent assumptions panel is the primary modeling interaction surface. It stays visible while you review outputs so planning becomes edit-and-observe instead of edit-then-hunt.',
    details: [
      'The rail is independently collapsible and resizable, which lets you choose between a denser input workspace and a wider dashboard reading area depending on the task.',
      'Assumptions are rendered from metadata tied to stable model keys, so the UI remains aligned with the calculation layer rather than drifting into label-only forms.',
      'This is meant to support live review sessions where you want to change a driver and immediately understand what areas of the model are affected.',
    ],
  },
  {
    title: 'Quick-edit status and modes',
    selector: '[data-testid="assumptions-sidebar-summary"]',
    sectionLabel: 'Sidebar controls',
    summary:
      'The assumptions rail summarizes how many inputs have moved from base and what filtering mode you are using while you work.',
    details: [
      'Changed counts become especially important after the first successful run, because they signal that current outputs may now be stale and awaiting recalculation.',
      'Context mode narrows the rail to inputs relevant to the current page, while changed-inputs mode is useful for review, QA, or executive walkthroughs.',
      'The point of these controls is to keep the rail compact and useful even when the full assumption universe becomes large.',
    ],
  },
  {
    title: 'Header state and freshness',
    selector: '[data-testid="top-header-main"]',
    sectionLabel: 'Run-state controls',
    summary:
      'The sticky top bar is the model’s operational status line. It tells you where you are, whether the outputs are current, and how much input drift exists right now.',
    details: [
      'Not calculated, calculating, ready, stale, and error are intentionally separate states so users can trust whether the outputs on screen are safe to interpret.',
      'Because the header stays visible while the workspace scrolls, the calculation status and control actions remain accessible during long table reviews.',
      'This is where you should check freshness before taking numbers into a memo, an investment note, or a planning conversation.',
    ],
  },
  {
    title: 'Calculate action',
    selector: '[data-testid="calculate-button"]',
    sectionLabel: 'Run trigger',
    summary:
      'This button turns assumptions into outputs. Until the first calculation is completed, dashboards stay intentionally empty so the user never mistakes configuration for results.',
    details: [
      'After the first successful run, assumption edits can mark the model stale and trigger debounced recalculation while the previous successful outputs remain visible.',
      'That preserves continuity during analysis and makes it easier to observe what changed instead of blanking the entire dashboard while a new run is pending.',
      'Use the calculate action as the explicit checkpoint where the workbook-backed and integrated layers are refreshed.',
    ],
  },
  {
    title: 'Scenario chips',
    selector: '[data-testid="scenario-chip-row"]',
    sectionLabel: 'Scenario navigation',
    summary:
      'Scenario chips give you a fast way to swap between saved cases from the header without leaving the current analytical page.',
    details: [
      'Scenario loading updates the shared assumption state first, then flows into recalculation and comparison behavior from there.',
      'This keeps scenario work grounded in the same analytical surfaces instead of forcing you into a detached scenario-only screen for routine switching.',
      'Because scenario changes are common in planning workflows, the chips are intentionally compact and always near the run-state controls.',
    ],
  },
  {
    title: 'Analytical workspace',
    selector: '[data-testid="main-workspace-scroll"]',
    sectionLabel: 'Core dashboard area',
    summary:
      'The main workspace is where KPI cards, charts, statements, validation summaries, and categorized dashboard sections render for review.',
    details: [
      'Pages are deliberately grouped into modules such as overview, operations, financials, returns, risks, and integrity so the information density stays readable.',
      'This region scrolls independently from both sidebars, which helps you keep navigation and assumptions accessible during long-form dashboard review.',
      'As the model grows, this is the area that carries the investor-facing planning story from high-level summary down to supporting detail.',
    ],
  },
  {
    title: 'Utility explanation panel',
    selector: '[data-testid="utility-panel"]',
    sectionLabel: 'Explainability layer',
    summary:
      'The right panel is the explanation and audit companion to the dashboards. It holds integrity counts, dependency notes, KPI context, and selected-assumption impact summaries.',
    details: [
      'Its purpose is to explain why a number moved, not just report that it moved.',
      'That keeps the central workspace focused on primary analytical outputs while still giving the user immediate access to rationale and diagnostics.',
      'As formula tracing matures, this panel can absorb more explanatory depth without cluttering the main dashboard sections.',
    ],
  },
  {
    title: 'Walkthrough and theme tools',
    selector: '[data-testid="walkthrough-toggle"]',
    sectionLabel: 'Header tools',
    summary:
      'The help control reopens this tour at any time, and the theme control beside it lets you switch visual mode without changing the app’s professional analytical tone.',
    details: [
      'The walkthrough opens each time the app starts so a fresh session always begins with orientation available, especially useful for infrequent users or stakeholder demos.',
      'Hover titles on the icon controls keep the toolbar compact while still making each action readable and accessible.',
      'These tools stay intentionally restrained so the app feels like a serious planning system rather than a consumer onboarding experience.',
    ],
  },
  {
    title: 'How to explore effectively',
    selector: '[data-testid="main-workspace-scroll"]',
    sectionLabel: 'Working rhythm',
    summary:
      'A strong review rhythm is: inspect the current page, adjust assumptions in the rail, watch freshness and toasts, then use integrity and utility surfaces to explain the new result.',
    details: [
      'Start with Executive Summary for the top-line case, then drill into Fleet, Platform, Energy, and Consolidated pages when you need the supporting structure behind the headline view.',
      'Use Scenario Studio and Sensitivity Lab when the question becomes comparative or directional rather than simply descriptive.',
      'When something looks questionable, Integrity Checks and Validation Report are the fastest places to separate a true model signal from a modeling issue or reconciliation gap.',
    ],
  },
] as const;

export const WALKTHROUGH_STEP_COUNT = walkthroughSteps.length;

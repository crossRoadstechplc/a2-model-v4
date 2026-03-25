import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function SunIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="10" r="3.25" />
      <path d="M10 1.75v2.1M10 16.15v2.1M18.25 10h-2.1M3.85 10h-2.1M15.84 4.16l-1.49 1.49M5.65 14.35l-1.49 1.49M15.84 15.84l-1.49-1.49M5.65 5.65L4.16 4.16" />
    </BaseIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12.91 2.58a7.45 7.45 0 1 0 4.51 11.54A6.75 6.75 0 0 1 12.91 2.58Z" />
    </BaseIcon>
  );
}

export function PanelLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="2.25" y="2.25" width="15.5" height="15.5" rx="2.25" />
      <path d="M6.75 2.5v15" />
    </BaseIcon>
  );
}

export function PanelRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="2.25" y="2.25" width="15.5" height="15.5" rx="2.25" />
      <path d="M13.25 2.5v15" />
    </BaseIcon>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 5h12M4 10h12M4 15h12" />
      <circle cx="7" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7.5 3.25H3.25v4.25M12.5 3.25h4.25v4.25M16.75 12.5v4.25H12.5M7.5 16.75H3.25V12.5" />
      <path d="M7.5 3.25 3.25 7.5M12.5 3.25l4.25 4.25M12.5 16.75l4.25-4.25M7.5 16.75 3.25 12.5" />
    </BaseIcon>
  );
}

export function CollapseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8.25 3.25H3.25v5M16.75 3.25h-5v5M16.75 16.75h-5v-5M8.25 16.75h-5v-5" />
      <path d="M8.25 8.25 3.25 3.25M11.75 8.25l5-5M11.75 11.75l5 5M8.25 11.75l-5 5" />
    </BaseIcon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12.5 4.25-5 5 5 5" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m7.5 4.25 5 5-5 5" />
    </BaseIcon>
  );
}

export function ArrowTopRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 14 14 6M8 6h6v6" />
    </BaseIcon>
  );
}

export function CalculatorIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="2.5" width="12" height="15" rx="2" />
      <path d="M6.5 5.75h7M7 10h1M10 10h1M13 10h0M7 13h1M10 13h1M13 13h0" />
    </BaseIcon>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10.5 7.5 6l3 3 6-5.5" />
      <path d="M3 16.5h14" />
    </BaseIcon>
  );
}

export function FleetIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12.5V7.75a1.5 1.5 0 0 1 1.5-1.5h7.75l2.75 3v3.25" />
      <path d="M5.5 14.5h7M5.5 14.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM13.5 14.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </BaseIcon>
  );
}

export function PlatformIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="3" width="14" height="10" rx="2" />
      <path d="M6.5 16.5h7M8 13v3.5M12 13v3.5" />
    </BaseIcon>
  );
}

export function EnergyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M11.75 2.75 5.5 10h3l-.25 7.25L14.5 10h-3.25l.5-7.25Z" />
    </BaseIcon>
  );
}

export function ConsolidatedIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="2.75" y="4.5" width="4.5" height="10.75" rx="1" />
      <rect x="8" y="2.75" width="4.5" height="12.5" rx="1" />
      <rect x="13.25" y="6.25" width="4" height="9" rx="1" />
    </BaseIcon>
  );
}

export function ScenariosIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="6" cy="6" r="2.25" />
      <circle cx="14" cy="6" r="2.25" />
      <circle cx="10" cy="14" r="2.25" />
      <path d="M7.8 7.65 8.9 11M12.2 7.65 11.1 11" />
    </BaseIcon>
  );
}

export function SensitivityIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 14.5 8 10.5l2.5 2.5 5-6" />
      <path d="M4 4.5v10h12" />
    </BaseIcon>
  );
}

export function IntegrityIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 2.75 4.25 5v4.5c0 3.55 2.25 6.7 5.75 7.75 3.5-1.05 5.75-4.2 5.75-7.75V5L10 2.75Z" />
      <path d="m7.5 10.25 1.5 1.5 3.5-3.5" />
    </BaseIcon>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 2.75h7l3 3v11.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 17.25V4.25A1.5 1.5 0 0 1 5.5 2.75Z" />
      <path d="M12 2.75v3h3M7 10h6M7 13h6" />
    </BaseIcon>
  );
}

export function ExportIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 3.25v8.5M6.75 7l3.25-3.75L13.25 7" />
      <path d="M4 12.75v3a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </BaseIcon>
  );
}

export function DocumentationIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 3.25h8a2 2 0 0 1 2 2v11.5a2 2 0 0 0-2-2h-8Z" />
      <path d="M4.5 3.25a2 2 0 0 0-2 2v11.5a2 2 0 0 1 2-2h8" />
    </BaseIcon>
  );
}

export function HelpCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M7.9 7.45a2.4 2.4 0 1 1 3.6 2.08c-.83.46-1.5.93-1.5 2.02" />
      <path d="M10 14.5h0" />
    </BaseIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 5 15 15M15 5 5 15" />
    </BaseIcon>
  );
}

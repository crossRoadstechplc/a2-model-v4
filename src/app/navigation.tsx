import type { ReactNode } from 'react';
import {
  ConsolidatedIcon,
  DocumentationIcon,
  EnergyIcon,
  ExportIcon,
  FleetIcon,
  IntegrityIcon,
  OverviewIcon,
  PlatformIcon,
  ReportIcon,
  ScenariosIcon,
  SensitivityIcon,
} from '../components/ui/icons';

export type NavItem = {
  label: string;
  path: string;
  shortLabel: string;
  icon: ReactNode;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const overviewItems: NavItem[] = [
  {
    label: 'Executive Summary',
    path: '/',
    shortLabel: 'ES',
    icon: <OverviewIcon className="h-5 w-5" />,
  },
];

const entityItems: NavItem[] = [
  {
    label: 'A2 Fleet',
    path: '/a2-fleet',
    shortLabel: 'FL',
    icon: <FleetIcon className="h-5 w-5" />,
  },
  {
    label: 'A2 Platform',
    path: '/a2-platform',
    shortLabel: 'PF',
    icon: <PlatformIcon className="h-5 w-5" />,
  },
  {
    label: 'A2 Energy',
    path: '/a2-energy',
    shortLabel: 'EN',
    icon: <EnergyIcon className="h-5 w-5" />,
  },
  {
    label: 'Consolidated / Corridor View',
    path: '/corridor-view',
    shortLabel: 'CV',
    icon: <ConsolidatedIcon className="h-5 w-5" />,
  },
];

const analysisItems: NavItem[] = [
  {
    label: 'Scenarios',
    path: '/scenarios',
    shortLabel: 'SC',
    icon: <ScenariosIcon className="h-5 w-5" />,
  },
  {
    label: 'Sensitivities',
    path: '/sensitivities',
    shortLabel: 'SN',
    icon: <SensitivityIcon className="h-5 w-5" />,
  },
];

const reportItems: NavItem[] = [
  {
    label: 'Integrity Checks',
    path: '/integrity-checks',
    shortLabel: 'IC',
    icon: <IntegrityIcon className="h-5 w-5" />,
  },
  {
    label: 'Validation Report',
    path: '/validation-report',
    shortLabel: 'VR',
    icon: <ReportIcon className="h-5 w-5" />,
  },
  {
    label: 'Save / Export',
    path: '/save-export',
    shortLabel: 'SE',
    icon: <ExportIcon className="h-5 w-5" />,
  },
];

const systemItems: NavItem[] = [
  {
    label: 'Documentation',
    path: '/documentation',
    shortLabel: 'DC',
    icon: <DocumentationIcon className="h-5 w-5" />,
  },
];

export const navigationSections: NavSection[] = [
  { title: 'Overview', items: overviewItems },
  { title: 'Entities', items: entityItems },
  { title: 'Analysis', items: analysisItems },
  { title: 'Outputs / Reports', items: reportItems },
  { title: 'System / Documentation', items: systemItems },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);

const hiddenRouteLabels = [['/assumptions', 'Assumptions']] as const;

export const pathToLabel = new Map<string, string>([
  ...navigationItems.map((item) => [item.path, item.label] as const),
  ...hiddenRouteLabels,
]);

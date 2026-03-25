import { AssumptionsEditor } from '../components/assumptions/AssumptionsEditor';
import {
  ExecutiveSummaryDashboard,
  FleetAnalyticsDashboard,
} from '../components/model/A2FleetDashboards';
import {
  ConsolidatedDashboard,
  EnergyDashboard,
  PlatformDashboard,
} from '../components/model/IntegratedDashboards';
import { IntegrityChecksDashboard } from '../components/planning/IntegrityChecksDashboard';
import { DocumentationDashboard } from '../components/planning/DocumentationDashboard';
import { ScenarioStudio } from '../components/planning/ScenarioStudio';
import { SensitivityLab } from '../components/planning/SensitivityLab';
import { ValidationReportDashboard } from '../components/planning/ValidationReportDashboard';
import { PageScaffold } from './PageScaffold';

export function ExecutiveSummaryPage() {
  return <ExecutiveSummaryDashboard />;
}

export function AssumptionsPage() {
  return <AssumptionsEditor context="page" />;
}

export function FleetPage() {
  return <FleetAnalyticsDashboard />;
}

export function PlatformPage() {
  return <PlatformDashboard />;
}

export function EnergyPage() {
  return <EnergyDashboard />;
}

export function CorridorViewPage() {
  return <ConsolidatedDashboard />;
}

export function ScenariosPage() {
  return <ScenarioStudio />;
}

export function SensitivitiesPage() {
  return <SensitivityLab />;
}

export function IntegrityChecksPage() {
  return <IntegrityChecksDashboard />;
}

export function ValidationReportPage() {
  return <ValidationReportDashboard />;
}

export function SaveExportPage() {
  return (
    <PageScaffold
      title="Save / Export"
      intro="Save states, export actions, and investor-ready output packaging will render here."
      sections={[
        {
          title: 'Export Queue',
          description:
            'Placeholder for report generation, workbook export, and snapshot packaging.',
          body: 'The shell separates export controls from the calculation engine so downstream jobs can attach later without changing the navigation model.',
        },
      ]}
    />
  );
}

export function DocumentationPage() {
  return <DocumentationDashboard />;
}

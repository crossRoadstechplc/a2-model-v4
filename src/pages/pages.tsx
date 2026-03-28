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
import { SaveExportDashboard } from '../components/planning/SaveExportDashboard';
import { ScenarioStudio } from '../components/planning/ScenarioStudio';
import { SensitivityLab } from '../components/planning/SensitivityLab';
import { ValidationReportDashboard } from '../components/planning/ValidationReportDashboard';

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
  return <SaveExportDashboard />;
}

export function DocumentationPage() {
  return <DocumentationDashboard />;
}

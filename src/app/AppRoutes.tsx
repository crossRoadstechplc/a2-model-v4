import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/shell/AppShell';
import {
  AssumptionsPage,
  CorridorViewPage,
  DocumentationPage,
  EnergyPage,
  ExecutiveSummaryPage,
  FleetPage,
  IntegrityChecksPage,
  PlatformPage,
  SaveExportPage,
  ScenariosPage,
  SensitivitiesPage,
  ValidationReportPage,
} from '../pages/pages';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<ExecutiveSummaryPage />} />
        <Route path="/assumptions" element={<AssumptionsPage />} />
        <Route path="/a2-fleet" element={<FleetPage />} />
        <Route path="/a2-platform" element={<PlatformPage />} />
        <Route path="/a2-energy" element={<EnergyPage />} />
        <Route path="/corridor-view" element={<CorridorViewPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/sensitivities" element={<SensitivitiesPage />} />
        <Route path="/integrity-checks" element={<IntegrityChecksPage />} />
        <Route path="/validation-report" element={<ValidationReportPage />} />
        <Route path="/save-export" element={<SaveExportPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

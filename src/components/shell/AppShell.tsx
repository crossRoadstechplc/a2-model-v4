import { Outlet, useLocation } from 'react-router-dom';
import { useSyncTheme } from '../../hooks/useSyncTheme';
import { useAppStore } from '../../store/appStore';
import { AssumptionsSidebar } from './AssumptionsSidebar';
import { AppWalkthrough } from './AppWalkthrough';
import { CalculationToastStack } from './CalculationToastStack';
import { PrimarySidebar } from './PrimarySidebar';
import { TopHeader } from './TopHeader';
import { UtilityPanel } from './UtilityPanel';
import { useEffect } from 'react';

export function AppShell() {
  useSyncTheme();
  const location = useLocation();
  const setActivePathname = useAppStore((state) => state.setActivePathname);

  useEffect(() => {
    setActivePathname(location.pathname);
  }, [location.pathname, setActivePathname]);

  return (
    <div className="h-screen overflow-hidden bg-app-bg text-app-text">
      <CalculationToastStack />
      <AppWalkthrough />
      <div className="flex h-screen overflow-hidden">
        <PrimarySidebar />
        <AssumptionsSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopHeader />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <main
              className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 lg:px-6"
              data-testid="main-workspace-scroll"
            >
              <Outlet />
            </main>
            <UtilityPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

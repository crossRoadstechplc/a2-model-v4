import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

export function useSyncTheme() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);
}

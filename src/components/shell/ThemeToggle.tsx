import { useUIStore } from '../../store/uiStore';
import { MoonIcon, SunIcon } from '../ui/icons';
import { IconButton } from '../ui/IconButton';

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <IconButton
      icon={
        isDark ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )
      }
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      active={isDark}
      testId="theme-toggle"
    />
  );
}

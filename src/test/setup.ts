import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAppStore } from '../store/appStore';
import { resetModelStore } from '../store/modelStore';
import { resetUIStore } from '../store/uiStore';

beforeEach(() => {
  localStorage.clear();
  resetUIStore();
  resetModelStore();
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = 'light';
});

afterEach(() => {
  cleanup();
  useAppStore.persist.clearStorage();
});

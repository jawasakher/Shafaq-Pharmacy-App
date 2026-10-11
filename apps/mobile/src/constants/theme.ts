import '@/global.css';

import { Platform } from 'react-native';

export const ShafaqColors = {
  primary: '#19A9CC',
  primaryDark: '#087EA4',
  primaryLight: '#DDF6FC',
  secondary: '#65D7E8',
  background: '#F4FCFE',
  surface: '#FFFFFF',
  surfaceElevated: '#F0FAFD',
  border: '#D9EEF4',
  textPrimary: '#16485C',
  textSecondary: '#688795',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const Colors = {
  light: {
    text: '#16485C',
    background: '#F4FCFE',
    backgroundElement: '#F0FAFD',
    backgroundSelected: '#DDF7FC',
    textSecondary: '#688795',
  },
  dark: {
    text: '#16485C',
    background: '#F4FCFE',
    backgroundElement: '#F0FAFD',
    backgroundSelected: '#DDF7FC',
    textSecondary: '#688795',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

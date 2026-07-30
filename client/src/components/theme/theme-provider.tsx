import { useEffect, useState } from 'react';
import {
  ThemeProviderContext,
  type Theme,
  type ThemeProviderState,
} from './theme-context';
import { flushSync } from 'react-dom';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value: ThemeProviderState = {
    theme,
    setTheme: async (nextTheme, animationStartPosition) => {
      if (nextTheme === theme) return;

      localStorage.setItem(storageKey, nextTheme);
      const root = document.documentElement;

      if (animationStartPosition) {
        root.classList.add('theme-clip-transition');
      }

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
        });
      });

      if (animationStartPosition) {
        transition.finished.finally(() => {
          root.classList.remove('theme-clip-transition');
        });
      }

      try {
        await transition.ready;
        if (animationStartPosition) {
          const { x, y } = animationStartPosition;

          const maxRadius = Math.hypot(
            Math.max(window.innerWidth - x, x),
            Math.max(window.innerHeight - y, y),
          );

          await root.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 700,
              easing: 'ease-in-out',
              pseudoElement: '::view-transition-new(root)',
            },
          ).finished;
        }
      } catch (err) {
        console.log(err);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

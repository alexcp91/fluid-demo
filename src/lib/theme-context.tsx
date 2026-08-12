"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

type Theme = "system" | "light" | "dark";

const themeOrder: Theme[] = ["system", "light", "dark"];
const STORAGE_KEY = "fluid-demo-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeContext must be used within a ThemeProvider");
  return ctx;
}

function readStoredTheme(fallback: Theme): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "system" || raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Fluid Functionalism theme provider — toggles `.light` / `.dark` on `<html>`
 * so `light-dark()` tokens and the shadow ladder resolve correctly.
 * Pattern aligned with Fluid docs + shadcn class-based dark mode.
 */
function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === "undefined" ? defaultTheme : readStoredTheme(defaultTheme)
  );
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hasAppliedRef = useRef(false);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next =
        themeOrder[(themeOrder.indexOf(prev) + 1) % themeOrder.length];
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const animate = hasAppliedRef.current;
    hasAppliedRef.current = true;
    if (animate) {
      root.classList.add("transitioning");
      void root.offsetHeight;
    }
    root.classList.remove("light", "dark");
    if (theme !== "system") root.classList.add(theme);
    if (animate) {
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = setTimeout(
        () => root.classList.remove("transitioning"),
        200
      );
    }
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "t" && e.key !== "T") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      e.preventDefault();
      cycleTheme();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [cycleTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export { ThemeProvider, useThemeContext };
export type { Theme };

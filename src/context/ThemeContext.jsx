"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const THEME_KEY = "delta_broker_theme";

const ThemeContext = createContext({
  theme: "light",
  isLight: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
      }
    } catch {
      /* keep default */
    }
    setReady(true);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      if (value !== "light" && value !== "dark") return prev;
      try {
        localStorage.setItem(THEME_KEY, value);
      } catch {
        /* ignore */
      }
      return value;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme,
      isLight: theme === "light",
      setTheme,
      toggleTheme,
      ready,
    }),
    [theme, setTheme, toggleTheme, ready]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

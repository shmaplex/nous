// src/context/ThemeContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextProps {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: "auto",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>("auto");

  useEffect(() => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (theme === "auto") {
      root.classList.toggle("dark", systemPrefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Hook to use theme functionality
 * Usage:
 *   const { theme, toggleTheme } = useTheme();
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};

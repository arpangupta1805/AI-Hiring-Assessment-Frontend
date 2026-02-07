"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";

/**
 * ThemeToggle Component
 * Minimal theme switcher button
 */
export function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
        p-2 rounded-lg
        text-[var(--text-secondary)]
        hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-hover)]
        transition-colors duration-150
        ${className}
      `}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            {theme === "light" ? (
                <Moon size={18} />
            ) : (
                <Sun size={18} />
            )}
        </button>
    );
}

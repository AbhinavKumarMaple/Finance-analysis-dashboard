"use client";

import { Moon, Sun, Menu, Calendar } from "lucide-react";
import { usePreferencesStore } from "@/store";
import { useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const theme = usePreferencesStore((state) => state.preferences.theme);
    const setTheme = usePreferencesStore((state) => state.setTheme);
    const globalDateRange = usePreferencesStore((state) => state.preferences.globalDateRange);

    const isDateFilterActive = globalDateRange.start !== null || globalDateRange.end !== null;

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "...";
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 lg:left-64">
            <div className="flex h-full items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    {/* Hamburger menu for mobile */}
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    )}

                    {/* Global Date Range Indicator */}
                    {isDateFilterActive && (
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                                {formatDate(globalDateRange.start)} → {formatDate(globalDateRange.end)}
                            </span>
                            <span className="sm:hidden">Date Filter</span>
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? (
                            <Moon className="h-5 w-5" />
                        ) : (
                            <Sun className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}

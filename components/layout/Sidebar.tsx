"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Home,
    TrendingUp,
    PieChart,
    DollarSign,
    Target,
    Upload,
    FileText,
    Tags,
    Settings,
    Lightbulb,
    TrendingUpIcon,
    FileBarChart,
    X,
} from "lucide-react";

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Upload", href: "/upload", icon: Upload },
    { name: "Transactions", href: "/transactions", icon: FileText },
    { name: "Cash Flow", href: "/cashflow", icon: TrendingUp },
    { name: "Spending", href: "/spending", icon: PieChart },
    { name: "Income", href: "/income", icon: DollarSign },
    { name: "Budgets", href: "/budgets", icon: Target },
    { name: "Insights", href: "/insights", icon: Lightbulb },
    { name: "Forecast", href: "/forecast", icon: TrendingUpIcon },
    { name: "Reports", href: "/reports", icon: FileBarChart },
    { name: "Tags", href: "/tags", icon: Tags },
    { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (onClose) {
            onClose();
        }
    }, [pathname]);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && onClose && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-950 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0`}
            >
                <div className="flex h-full flex-col">
                    {/* Logo/Brand */}
                    <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white lg:text-xl">
                            Finance Dashboard
                        </h1>
                        {/* Close button for mobile */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Privacy Badge */}
                    <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
                            <p className="text-xs font-medium text-green-800 dark:text-green-400">
                                🔒 All data processed locally
                            </p>
                            <p className="mt-1 text-xs text-green-600 dark:text-green-500">
                                Your financial data never leaves your device
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

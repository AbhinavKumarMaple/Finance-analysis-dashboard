"use client";

import { Settings as SettingsIcon, Palette, Database, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { StorageManager } from "@/components/settings/StorageManager";
import { DataClearOptions } from "@/components/settings/DataClearOptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <SettingsIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your preferences and application settings
                    </p>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Appearance Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Appearance
                        </h2>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Storage Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Storage
                        </h2>
                    </div>
                    <StorageManager />
                </div>
            </div>

            {/* Privacy Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Privacy & Security
                    </h2>
                </div>

                {/* Privacy Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Privacy-First Design</CardTitle>
                        <CardDescription>
                            Your financial data is completely private and secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <PrivacyFeature
                                icon="🔒"
                                title="Local Processing"
                                description="All data processing happens entirely in your browser. Nothing is sent to any server."
                            />
                            <PrivacyFeature
                                icon="💾"
                                title="Local Storage"
                                description="Your data is stored only on your device using IndexedDB. No cloud storage involved."
                            />
                            <PrivacyFeature
                                icon="🔐"
                                title="Password Protection"
                                description="Bank statements are decrypted locally using your password. We never see your password or data."
                            />
                            <PrivacyFeature
                                icon="🚫"
                                title="No Tracking"
                                description="No analytics, no tracking, no telemetry. Your financial activity is completely private."
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Management Section */}
            <div className="space-y-6">
                <DataClearOptions />
            </div>
        </div>
    );
}

function PrivacyFeature({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {title}
                </h4>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {description}
                </p>
            </div>
        </div>
    );
}

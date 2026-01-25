"use client";

import { Moon, Sun } from "lucide-react";
import { usePreferencesStore } from "@/store/preferencesStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

export function ThemeToggle() {
    const { preferences, toggleTheme } = usePreferencesStore();
    const theme = preferences.theme;

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                    Choose your preferred color scheme
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="lg"
                        onClick={() => theme === "dark" && toggleTheme()}
                        className="flex-1"
                    >
                        <Sun className="mr-2 h-5 w-5" />
                        Light
                    </Button>
                    <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="lg"
                        onClick={() => theme === "light" && toggleTheme()}
                        className="flex-1"
                    >
                        <Moon className="mr-2 h-5 w-5" />
                        Dark
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePreferencesStore } from "@/store";
import { GripVertical } from "lucide-react";

export interface Widget {
    id: string;
    title: string;
    component: ReactNode;
    defaultPosition: number;
    isVisible: boolean;
}

interface WidgetGridProps {
    widgets: Widget[];
}

export function WidgetGrid({ widgets }: WidgetGridProps) {
    const { preferences, setWidgetLayout } = usePreferencesStore();
    const [orderedWidgets, setOrderedWidgets] = useState<Widget[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Initialize widget order from preferences or use default
    useEffect(() => {
        const savedLayout = preferences.widgetLayout || [];

        if (savedLayout.length === 0) {
            // Use default order
            const sorted = [...widgets].sort((a, b) => a.defaultPosition - b.defaultPosition);
            setOrderedWidgets(sorted);
        } else {
            // Restore saved order
            const ordered = savedLayout
                .map(layout => widgets.find(w => w.id === layout.widgetId))
                .filter((w): w is Widget => w !== undefined);

            // Add any new widgets that aren't in saved layout
            const newWidgets = widgets.filter(
                w => !savedLayout.some(l => l.widgetId === w.id)
            );

            setOrderedWidgets([...ordered, ...newWidgets]);
        }
    }, [widgets, preferences.widgetLayout]);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === index) return;

        const newOrder = [...orderedWidgets];
        const draggedWidget = newOrder[draggedIndex];

        // Remove from old position
        newOrder.splice(draggedIndex, 1);

        // Insert at new position
        newOrder.splice(index, 0, draggedWidget);

        setOrderedWidgets(newOrder);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        // Save the new order to preferences
        const layout = orderedWidgets.map((widget, index) => ({
            widgetId: widget.id,
            position: { x: 0, y: index },
            size: { width: 1, height: 1 },
            isVisible: widget.isVisible,
        }));

        setWidgetLayout(layout);
        setDraggedIndex(null);
    };

    const handleToggleVisibility = (widgetId: string) => {
        const updatedWidgets = orderedWidgets.map(w =>
            w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
        );

        setOrderedWidgets(updatedWidgets);

        // Save to preferences
        const layout = updatedWidgets.map((widget, index) => ({
            widgetId: widget.id,
            position: { x: 0, y: index },
            size: { width: 1, height: 1 },
            isVisible: widget.isVisible,
        }));

        setWidgetLayout(layout);
    };

    const visibleWidgets = orderedWidgets.filter(w => w.isVisible);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Widget Visibility Controls */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Customize Dashboard
                </h3>
                <div className="flex flex-wrap gap-2">
                    {orderedWidgets.map((widget) => (
                        <button
                            key={widget.id}
                            onClick={() => handleToggleVisibility(widget.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${widget.isVisible
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                        >
                            {widget.title}
                        </button>
                    ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Drag widgets to reorder them
                </p>
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                {visibleWidgets.map((widget, index) => (
                    <div
                        key={widget.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move transition-opacity ${draggedIndex === index ? "opacity-50" : "opacity-100"
                            }`}
                    >
                        <div className="group relative">
                            {/* Drag Handle */}
                            <div className="absolute -left-2 top-4 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                                <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>

                            {/* Widget Content */}
                            {widget.component}
                        </div>
                    </div>
                ))}
            </div>

            {visibleWidgets.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-950">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No widgets visible. Enable widgets above to customize your dashboard.
                    </p>
                </div>
            )}
        </div>
    );
}

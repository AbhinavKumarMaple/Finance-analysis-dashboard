"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { clearAllData, clearSelectiveData } from "@/lib/storage/stats";

type DataType = "transactions" | "tags" | "budgets" | "limits" | "goals" | "preferences" | "files";

interface DataTypeOption {
    id: DataType;
    label: string;
    description: string;
}

const dataTypeOptions: DataTypeOption[] = [
    {
        id: "transactions",
        label: "Transactions",
        description: "All imported transaction data",
    },
    {
        id: "tags",
        label: "Tags & Categories",
        description: "Custom tags and categorization rules",
    },
    {
        id: "budgets",
        label: "Budgets",
        description: "Budget configurations and history",
    },
    {
        id: "limits",
        label: "Spending Limits",
        description: "Daily and monthly spending limits",
    },
    {
        id: "goals",
        label: "Savings Goals",
        description: "Savings goals and progress",
    },
    {
        id: "files",
        label: "File Records",
        description: "Uploaded file tracking information",
    },
    {
        id: "preferences",
        label: "Preferences",
        description: "App settings and preferences",
    },
];

export function DataClearOptions() {
    const [selectedTypes, setSelectedTypes] = useState<DataType[]>([]);
    const [showClearAllDialog, setShowClearAllDialog] = useState(false);
    const [showSelectiveDialog, setShowSelectiveDialog] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [clearSuccess, setClearSuccess] = useState(false);
    const [clearError, setCleanError] = useState<string | null>(null);

    const handleToggleType = (type: DataType) => {
        setSelectedTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    };

    const handleClearAll = async () => {
        try {
            setIsClearing(true);
            setClearSuccess(false);
            setCleanError(null);
            await clearAllData();
            setClearSuccess(true);
            setShowClearAllDialog(false);
            // Reload page after a short delay to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            setCleanError(err instanceof Error ? err.message : "Failed to clear data");
        } finally {
            setIsClearing(false);
        }
    };

    const handleClearSelective = async () => {
        if (selectedTypes.length === 0) {
            setCleanError("Please select at least one data type to clear");
            return;
        }

        try {
            setIsClearing(true);
            setClearSuccess(false);
            setCleanError(null);
            await clearSelectiveData(selectedTypes);
            setClearSuccess(true);
            setShowSelectiveDialog(false);
            setSelectedTypes([]);
            // Reload page after a short delay to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            setCleanError(err instanceof Error ? err.message : "Failed to clear data");
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>
                        Clear stored data to free up space or start fresh
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Success Message */}
                    {clearSuccess && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/20 dark:text-green-400">
                            ✓ Data cleared successfully. Reloading...
                        </div>
                    )}

                    {/* Error Message */}
                    {clearError && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-400">
                            {clearError}
                        </div>
                    )}

                    {/* Selective Clear */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Clear Specific Data
                        </h4>
                        <div className="space-y-2">
                            {dataTypeOptions.map((option) => (
                                <div key={option.id} className="flex items-start space-x-3">
                                    <Checkbox
                                        id={option.id}
                                        checked={selectedTypes.includes(option.id)}
                                        onCheckedChange={() => handleToggleType(option.id)}
                                    />
                                    <div className="flex-1">
                                        <Label
                                            htmlFor={option.id}
                                            className="text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            {option.label}
                                        </Label>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowSelectiveDialog(true)}
                            disabled={selectedTypes.length === 0 || isClearing}
                            className="w-full"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear Selected Data
                        </Button>
                    </div>

                    {/* Clear All */}
                    <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                                    Danger Zone
                                </h4>
                                <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                                    This action cannot be undone. All your data will be permanently deleted.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setShowClearAllDialog(true)}
                            disabled={isClearing}
                            className="w-full"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Clear All Confirmation Dialog */}
            <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear All Data?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete all your financial data, including transactions,
                            budgets, tags, and preferences. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowClearAllDialog(false)}
                            disabled={isClearing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClearAll}
                            disabled={isClearing}
                        >
                            {isClearing ? "Clearing..." : "Yes, Clear All Data"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Selective Clear Confirmation Dialog */}
            <Dialog open={showSelectiveDialog} onOpenChange={setShowSelectiveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear Selected Data?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the following data types:
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                {selectedTypes.map((type) => {
                                    const option = dataTypeOptions.find((o) => o.id === type);
                                    return option ? <li key={type}>{option.label}</li> : null;
                                })}
                            </ul>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSelectiveDialog(false)}
                            disabled={isClearing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClearSelective}
                            disabled={isClearing}
                        >
                            {isClearing ? "Clearing..." : "Yes, Clear Selected Data"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

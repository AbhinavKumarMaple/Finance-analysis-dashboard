"use client";

import { useState } from "react";
import { X, Save, Tag as TagIcon, FileText, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTransactionStore } from "@/store/transactionStore";
import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";

interface TransactionDetailProps {
    transaction: Transaction;
    tags: Tag[];
    onClose: () => void;
}

export default function TransactionDetail({
    transaction,
    tags,
    onClose,
}: TransactionDetailProps) {
    const updateTransaction = useTransactionStore(
        (state) => state.updateTransaction
    );

    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
        transaction.tagIds
    );
    const [notes, setNotes] = useState(transaction.notes || "");
    const [customTags, setCustomTags] = useState<string[]>(
        transaction.customTags || []
    );
    const [newCustomTag, setNewCustomTag] = useState("");
    const [isReviewed, setIsReviewed] = useState(transaction.isReviewed);
    const [hasChanges, setHasChanges] = useState(false);

    const handleTagToggle = (tagId: string) => {
        const newTagIds = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter((id) => id !== tagId)
            : [...selectedTagIds, tagId];
        setSelectedTagIds(newTagIds);
        setHasChanges(true);
    };

    const handleAddCustomTag = () => {
        if (newCustomTag.trim() && !customTags.includes(newCustomTag.trim())) {
            setCustomTags([...customTags, newCustomTag.trim()]);
            setNewCustomTag("");
            setHasChanges(true);
        }
    };

    const handleRemoveCustomTag = (tag: string) => {
        setCustomTags(customTags.filter((t) => t !== tag));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateTransaction(transaction.id, {
            tagIds: selectedTagIds,
            notes: notes || null,
            customTags,
            isReviewed,
            manualTagOverride: true,
        });
        onClose();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Transaction Details</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogDescription>
                        View and edit transaction information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Transaction Info */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">
                                    Date
                                </Label>
                                <p className="text-sm font-medium">{formatDate(transaction.date)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">
                                    Reference Number
                                </Label>
                                <p className="text-sm font-medium">{transaction.refNo}</p>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400">
                                Details
                            </Label>
                            <p className="text-sm">{transaction.details}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">
                                    Type
                                </Label>
                                <p className="text-sm font-medium capitalize">
                                    {transaction.type}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">
                                    Payment Method
                                </Label>
                                <p className="text-sm font-medium">{transaction.paymentMethod}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">
                                    Amount
                                </Label>
                                <p
                                    className={`text-sm font-bold ${transaction.type === "credit"
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {transaction.type === "credit" ? "+" : "-"}
                                    {formatCurrency(transaction.amount)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400">
                                Balance After Transaction
                            </Label>
                            <p className="text-sm font-medium">
                                {formatCurrency(transaction.balance)}
                            </p>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4" />
                            <Label>Categories</Label>
                            {transaction.manualTagOverride && (
                                <Badge variant="secondary" className="text-xs">
                                    Manual Override
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-md p-3">
                            {tags.map((tag) => (
                                <div key={tag.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`detail-tag-${tag.id}`}
                                        checked={selectedTagIds.includes(tag.id)}
                                        onCheckedChange={() => handleTagToggle(tag.id)}
                                    />
                                    <label
                                        htmlFor={`detail-tag-${tag.id}`}
                                        className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Tags */}
                    <div className="space-y-3">
                        <Label>Custom Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add custom tag..."
                                value={newCustomTag}
                                onChange={(e) => setNewCustomTag(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        handleAddCustomTag();
                                    }
                                }}
                            />
                            <Button onClick={handleAddCustomTag} size="sm">
                                Add
                            </Button>
                        </div>
                        {customTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {customTags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => handleRemoveCustomTag(tag)}
                                    >
                                        {tag}
                                        <X className="h-3 w-3 ml-1" />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <Label>Notes</Label>
                        </div>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                            placeholder="Add notes about this transaction..."
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                setHasChanges(true);
                            }}
                        />
                    </div>

                    {/* Review Status */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="reviewed"
                            checked={isReviewed}
                            onCheckedChange={(checked) => {
                                setIsReviewed(checked as boolean);
                                setHasChanges(true);
                            }}
                        />
                        <label
                            htmlFor="reviewed"
                            className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Mark as reviewed
                        </label>
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div>
                                <span className="font-medium">Source File:</span>{" "}
                                {transaction.sourceFile}
                            </div>
                            <div>
                                <span className="font-medium">Imported:</span>{" "}
                                {formatDate(transaction.importedAt)}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!hasChanges}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

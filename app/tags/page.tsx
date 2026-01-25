"use client";

import { TagManager } from "@/components/tags/TagManager";
import { TagEditor } from "@/components/tags/TagEditor";
import { useTagStore, useTransactionStore } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tag as TagIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Tag } from "@/types/tag";

export default function TagsPage() {
    const tags = useTagStore((state) => state.tags);
    const addTag = useTagStore((state) => state.addTag);
    const updateTag = useTagStore((state) => state.updateTag);
    const deleteTag = useTagStore((state) => state.deleteTag);
    const transactions = useTransactionStore((state) => state.transactions);
    const [showTagEditor, setShowTagEditor] = useState(false);

    // Calculate tag usage statistics
    const tagStats = tags.map((tag) => {
        const usageCount = transactions.filter((t) =>
            t.tagIds.includes(tag.id)
        ).length;
        const totalAmount = transactions
            .filter((t) => t.tagIds.includes(tag.id))
            .reduce((sum, t) => sum + (t.debit || 0), 0);

        return {
            tag,
            usageCount,
            totalAmount,
        };
    });

    const handleCreateTag = (tagData: Omit<Tag, "id" | "createdAt" | "updatedAt">) => {
        const newTag: Tag = {
            ...tagData,
            id: `tag-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        addTag(newTag);
    };

    const totalTagged = transactions.filter((t) => t.tagIds.length > 0).length;
    const untagged = transactions.length - totalTagged;

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tags & Categories
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage tags and categorization rules for your transactions
                </p>
            </div>

            {/* Quick Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                            <TagIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tags</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {tags.length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                            <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tagged</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {totalTagged}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                            <TagIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Untagged</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {untagged}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tag Manager */}
            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        All Tags
                    </h2>
                    <Button
                        onClick={() => setShowTagEditor(true)}
                        size="sm"
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Tag
                    </Button>
                </div>

                <TagManager
                    tags={tags}
                    onCreateTag={handleCreateTag}
                    onUpdateTag={updateTag}
                    onDeleteTag={deleteTag}
                />
            </div>

            {/* Tag Statistics */}
            {tagStats.length > 0 && (
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Tag Usage Statistics
                    </h2>

                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Tag
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Keywords
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Transactions
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Total Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {tagStats
                                        .sort((a, b) => b.usageCount - a.usageCount)
                                        .map(({ tag, usageCount, totalAmount }) => (
                                            <tr
                                                key={tag.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-900"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: tag.color }}
                                                        />
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {tag.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {tag.keywords.slice(0, 3).map((keyword, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                            >
                                                                {keyword}
                                                            </span>
                                                        ))}
                                                        {tag.keywords.length > 3 && (
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                                +{tag.keywords.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                                    {usageCount}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                                    ₹{totalAmount.toLocaleString("en-IN", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Tag Editor Modal */}
            {showTagEditor && <TagEditor onClose={() => setShowTagEditor(false)} />}

            {/* Help Section */}
            <Card className="mt-6">
                <div className="p-6">
                    <h3 className="mb-4 font-medium text-gray-900 dark:text-white">
                        About Tags
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                            Tags help you categorize transactions automatically based on keywords
                            found in transaction details.
                        </p>
                        <p>
                            When you create a tag, add keywords that commonly appear in transactions
                            for that category. The system will automatically match and tag
                            transactions.
                        </p>
                        <p>
                            You can also manually override automatic tags on individual transactions
                            from the Transactions page.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

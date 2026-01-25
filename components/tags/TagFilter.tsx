"use client";

/**
 * Tag Filter Component
 *
 * Filter interface for filtering transactions by tags.
 * Supports multi-select and shows transaction counts per tag.
 *
 * Requirements: 17.11, 17.12
 */

import { useState } from "react";
import type { Tag } from "../../types/tag";

interface TagFilterProps {
    tags: Tag[];
    selectedTagIds: string[];
    onSelectionChange: (tagIds: string[]) => void;
    tagCounts?: Map<string, number>; // Optional transaction counts per tag
}

export function TagFilter({
    tags,
    selectedTagIds,
    onSelectionChange,
    tagCounts,
}: TagFilterProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleToggleTag = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
        } else {
            onSelectionChange([...selectedTagIds, tagId]);
        }
    };

    const handleSelectAll = () => {
        onSelectionChange(tags.map((t) => t.id));
    };

    const handleClearAll = () => {
        onSelectionChange([]);
    };

    // Filter tags by search query
    const filteredTags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const selectedCount = selectedTagIds.length;
    const totalCount = tags.length;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        Filter by Tags
                    </span>
                    {selectedCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                            {selectedCount} selected
                        </span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Search */}
                    <div className="mt-3 mb-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tags..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handleSelectAll}
                            className="flex-1 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Tag List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredTags.map((tag) => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            const count = tagCounts?.get(tag.id) || 0;

                            return (
                                <label
                                    key={tag.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleTag(tag.id)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />

                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: tag.color }}
                                    />

                                    {tag.icon && (
                                        <span className="text-lg flex-shrink-0">{tag.icon}</span>
                                    )}

                                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                        {tag.name}
                                    </span>

                                    {tagCounts && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {count}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {filteredTags.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No tags found
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

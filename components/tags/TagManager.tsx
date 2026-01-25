"use client";

/**
 * Tag Manager Component
 *
 * Main interface for managing tags (CRUD operations).
 * Displays list of tags and allows creating, editing, and deleting tags.
 *
 * Requirements: 17.2, 17.7, 17.8, 17.9
 */

import { useState } from "react";
import type { Tag } from "../../types/tag";
import { TagEditor } from "./TagEditor";

interface TagManagerProps {
    tags: Tag[];
    onCreateTag: (tag: Omit<Tag, "id" | "createdAt" | "updatedAt">) => void;
    onUpdateTag: (tagId: string, updates: Partial<Tag>) => void;
    onDeleteTag: (tagId: string) => void;
}

export function TagManager({
    tags,
    onCreateTag,
    onUpdateTag,
    onDeleteTag,
}: TagManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleCreate = (tagData: Omit<Tag, "id" | "createdAt" | "updatedAt">) => {
        onCreateTag(tagData);
        setIsCreating(false);
    };

    const handleUpdate = (tagId: string, updates: Partial<Tag>) => {
        onUpdateTag(tagId, updates);
        setEditingTagId(null);
    };

    const handleDelete = (tagId: string) => {
        onDeleteTag(tagId);
        setDeleteConfirmId(null);
    };

    const editingTag = editingTagId ? tags.find((t) => t.id === editingTagId) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Tag Management
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Create and manage tags for categorizing transactions
                    </p>
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + Create Tag
                </button>
            </div>

            {/* Tag List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                    <div
                        key={tag.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                        {/* Tag Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {tag.icon && <span className="text-2xl">{tag.icon}</span>}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {tag.name}
                                    </h3>
                                    {tag.isDefault && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: tag.color }}
                            />
                        </div>

                        {/* Keywords */}
                        <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Keywords ({tag.keywords.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {tag.keywords.slice(0, 5).map((keyword, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                                {tag.keywords.length > 5 && (
                                    <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                        +{tag.keywords.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditingTagId(tag.id)}
                                className="flex-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setDeleteConfirmId(tag.id)}
                                className="flex-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {tags.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        No tags created yet
                    </p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Create Your First Tag
                    </button>
                </div>
            )}

            {/* Create Tag Modal */}
            {isCreating && (
                <TagEditor
                    onSave={handleCreate}
                    onCancel={() => setIsCreating(false)}
                />
            )}

            {/* Edit Tag Modal */}
            {editingTag && (
                <TagEditor
                    tag={editingTag}
                    onSave={(updates) => handleUpdate(editingTag.id, updates)}
                    onCancel={() => setEditingTagId(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Delete Tag
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this tag? This action cannot be undone.
                            Transactions with this tag will become untagged.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

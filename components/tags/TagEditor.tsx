"use client";

/**
 * Tag Editor Component
 *
 * Modal form for creating and editing tags.
 * Allows editing name, keywords, color, and icon.
 *
 * Requirements: 17.2, 17.7, 17.8
 */

import { useState, useEffect } from "react";
import type { Tag } from "../../types/tag";
import { TAG_COLORS, TAG_ICONS, validateTagData } from "../../lib/categorization/defaults";

interface TagEditorProps {
    tag?: Tag;
    onSave: (tagData: Omit<Tag, "id" | "createdAt" | "updatedAt">) => void;
    onCancel: () => void;
}

export function TagEditor({ tag, onSave, onCancel }: TagEditorProps) {
    const [name, setName] = useState(tag?.name || "");
    const [keywords, setKeywords] = useState<string[]>(tag?.keywords || []);
    const [keywordInput, setKeywordInput] = useState("");
    const [color, setColor] = useState(tag?.color || TAG_COLORS[0]);
    const [icon, setIcon] = useState(tag?.icon || null);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!tag;

    const handleAddKeyword = () => {
        const trimmed = keywordInput.trim();
        if (trimmed && !keywords.includes(trimmed)) {
            setKeywords([...keywords, trimmed]);
            setKeywordInput("");
            setError(null);
        }
    };

    const handleRemoveKeyword = (keyword: string) => {
        setKeywords(keywords.filter((k) => k !== keyword));
    };

    const handleKeywordInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddKeyword();
        }
    };

    const handleSave = () => {
        const validationError = validateTagData(name, keywords);
        if (validationError) {
            setError(validationError);
            return;
        }

        onSave({
            name,
            keywords,
            color,
            icon,
            isDefault: tag?.isDefault || false,
            parentTagId: tag?.parentTagId || null,
        });
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {isEditing ? "Edit Tag" : "Create New Tag"}
                    </h2>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tag Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Food & Delivery"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    {/* Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Keywords
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={handleKeywordInputKeyDown}
                                placeholder="Add keyword and press Enter"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <button
                                onClick={handleAddKeyword}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                >
                                    {keyword}
                                    <button
                                        onClick={() => handleRemoveKeyword(keyword)}
                                        className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        {keywords.length === 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Add at least one keyword to match transactions
                            </p>
                        )}
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TAG_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-10 h-10 rounded-lg transition-all ${color === c
                                            ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800"
                                            : "hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Icon (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setIcon(null)}
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${icon === null
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                    }`}
                            >
                                <span className="text-gray-400">—</span>
                            </button>
                            {TAG_ICONS.map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${icon === i
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                        }`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        {isEditing ? "Save Changes" : "Create Tag"}
                    </button>
                </div>
            </div>
        </div>
    );
}

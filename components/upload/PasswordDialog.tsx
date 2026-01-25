"use client";

/**
 * Password Dialog Component
 *
 * Modal dialog for entering password for encrypted Excel files.
 * Allows skipping password for unencrypted files.
 *
 * Requirements: 1.1, 1.6, 1.7
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { FormEvent, KeyboardEvent } from "react";

interface PasswordDialogProps {
    fileName: string;
    onSubmit: (password: string | null) => Promise<void>;
    onClose: () => void;
    isProcessing?: boolean;
    error?: string | null;
}

export function PasswordDialog({
    fileName,
    onSubmit,
    onClose,
    isProcessing = false,
    error = null,
}: PasswordDialogProps) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Focus password input on mount
    useEffect(() => {
        passwordInputRef.current?.focus();
    }, []);

    // Handle form submission
    const handleSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!isProcessing) {
                onSubmit(password || null);
            }
        },
        [password, isProcessing, onSubmit],
    );

    // Handle skip (no password)
    const handleSkip = useCallback(() => {
        if (!isProcessing) {
            onSubmit(null);
        }
    }, [isProcessing, onSubmit]);

    // Handle escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape" && !isProcessing) {
                onClose();
            }
        },
        [isProcessing, onClose],
    );

    // Handle backdrop click
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget && !isProcessing) {
                onClose();
            }
        },
        [isProcessing, onClose],
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        File Password
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {fileName}
                    </p>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            If your Excel file is password-protected, enter the password below.
                            Otherwise, click "Skip" to proceed without a password.
                        </p>

                        {/* Password Input */}
                        <div className="relative">
                            <input
                                ref={passwordInputRef}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password (optional)"
                                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                disabled={isProcessing}
                            />

                            {/* Show/Hide Password Button */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                disabled={isProcessing}
                            >
                                {showPassword ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSkip}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            disabled={isProcessing}
                        >
                            Skip
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processing..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

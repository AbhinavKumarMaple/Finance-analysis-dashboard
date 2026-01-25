"use client";

/**
 * File Upload Component
 *
 * Drag-and-drop file upload interface for Excel bank statements.
 * Handles file validation, password entry, and duplicate detection.
 *
 * Requirements: 1.1, 1.6, 1.7, 21.8
 */

import { useState, useCallback, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { PasswordDialog } from "./PasswordDialog";

interface FileUploadProps {
    onFileSelect: (file: File, password?: string) => Promise<void>;
    uploadedFiles?: string[]; // List of already uploaded file names
    maxFileSize?: number; // Max file size in bytes (default 10MB)
}

export function FileUpload({
    onFileSelect,
    uploadedFiles = [],
    maxFileSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validate file
    const validateFile = useCallback(
        (file: File): string | null => {
            // Check file type
            const validTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
            ];
            const validExtensions = [".xlsx", ".xls"];

            const hasValidType = validTypes.includes(file.type);
            const hasValidExtension = validExtensions.some((ext) =>
                file.name.toLowerCase().endsWith(ext),
            );

            if (!hasValidType && !hasValidExtension) {
                return "Invalid file format. Please upload an Excel file (.xlsx or .xls)";
            }

            // Check file size
            if (file.size > maxFileSize) {
                const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
                return `File size exceeds ${maxSizeMB}MB limit`;
            }

            // Check if file already uploaded
            if (uploadedFiles.includes(file.name)) {
                return `File "${file.name}" has already been uploaded`;
            }

            return null;
        },
        [maxFileSize, uploadedFiles],
    );

    // Handle file selection
    const handleFileSelection = useCallback(
        (file: File) => {
            setError(null);

            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }

            setSelectedFile(file);
            setShowPasswordDialog(true);
        },
        [validateFile],
    );

    // Handle drag events
    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileSelection(files[0]);
            }
        },
        [handleFileSelection],
    );

    // Handle file input change
    const handleFileInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileSelection(files[0]);
            }
        },
        [handleFileSelection],
    );

    // Handle password submission
    const handlePasswordSubmit = useCallback(
        async (password: string | null) => {
            if (!selectedFile) return;

            setIsProcessing(true);
            setError(null);

            try {
                await onFileSelect(selectedFile, password || undefined);
                setShowPasswordDialog(false);
                setSelectedFile(null);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to process file",
                );
            } finally {
                setIsProcessing(false);
            }
        },
        [selectedFile, onFileSelect],
    );

    // Handle password dialog close
    const handlePasswordDialogClose = useCallback(() => {
        setShowPasswordDialog(false);
        setSelectedFile(null);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    // Handle click on upload area
    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="w-full">
            {/* Upload Area */}
            <div
                className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                    }
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}
        `}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isProcessing}
                />

                <div className="flex flex-col items-center justify-center text-center">
                    {/* Upload Icon */}
                    <svg
                        className="w-12 h-12 mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>

                    {/* Text */}
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isProcessing ? "Processing..." : "Drop your Excel file here"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        or click to browse
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Supports .xlsx and .xls files (max {(maxFileSize / (1024 * 1024)).toFixed(0)}MB)
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Password Dialog */}
            {showPasswordDialog && selectedFile && (
                <PasswordDialog
                    fileName={selectedFile.name}
                    onSubmit={handlePasswordSubmit}
                    onClose={handlePasswordDialogClose}
                    isProcessing={isProcessing}
                    error={error}
                />
            )}
        </div>
    );
}

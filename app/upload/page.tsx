"use client";

import { FileUpload } from "@/components/upload/FileUpload";
import { useTransactionStore, useTagStore } from "@/store";
import { Card } from "@/components/ui/card";
import { FileText, Shield, CheckCircle, AlertCircle, Trash2, Calendar, FileCheck } from "lucide-react";
import { parseStatement } from "@/lib/parser";
import { categorizeAllTransactions } from "@/lib/categorization/matcher";
import { saveTransactions, deleteTransactionsBySourceFile } from "@/lib/storage/transactions";
import { mergeStatements } from "@/lib/parser/merge";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";

export default function UploadPage() {
    const transactions = useTransactionStore((state) => state.transactions);
    const setTransactions = useTransactionStore((state) => state.setTransactions);
    const tags = useTagStore((state) => state.tags);
    const [uploadedFiles, setUploadedFiles] = useState<Array<{
        name: string;
        uploadedAt: Date;
        transactionCount: number;
        dateRange: { start: Date; end: Date };
    }>>([]);
    const [lastUploadInfo, setLastUploadInfo] = useState<{
        fileName: string;
        count: number;
        newTransactions: number;
        duplicatesRemoved: number;
        dateRange: { start: Date; end: Date };
    } | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Handle file selection and processing
    const handleFileSelect = useCallback(
        async (file: File, password?: string) => {
            try {
                setUploadError(null);

                // Parse the statement
                const result = await parseStatement(file, password);

                if (!result.success) {
                    const errorMsg = result.errors[0]?.message || "Failed to parse statement";
                    setUploadError(errorMsg);
                    throw new Error(errorMsg);
                }

                // Categorize transactions
                categorizeAllTransactions(result.transactions, tags);

                // Merge with existing transactions and deduplicate
                const mergeResult = mergeStatements(transactions, result.transactions);

                // Save to store and storage
                setTransactions(mergeResult.transactions);
                await saveTransactions(mergeResult.transactions);

                // Calculate date range once
                const transactionDates = result.transactions.map((t: Transaction) => t.date.getTime());
                const dateRange = {
                    start: new Date(Math.min(...transactionDates)),
                    end: new Date(Math.max(...transactionDates)),
                };

                // Track uploaded file with details
                setUploadedFiles((prev) => [...prev, {
                    name: file.name,
                    uploadedAt: new Date(),
                    transactionCount: result.transactions.length,
                    dateRange,
                }]);

                // Update upload info with merge statistics
                setLastUploadInfo({
                    fileName: file.name,
                    count: result.transactions.length,
                    newTransactions: mergeResult.newTransactions,
                    duplicatesRemoved: mergeResult.duplicatesRemoved,
                    dateRange,
                });
            } catch (error) {
                console.error("Error processing file:", error);
                const errorMsg = error instanceof Error ? error.message : "Failed to process file";
                setUploadError(errorMsg);
                throw error;
            }
        },
        [transactions, tags, setTransactions]
    );

    // Handle file deletion
    const handleDeleteFile = useCallback(
        async (fileName: string) => {
            try {
                // Delete transactions from this file
                await deleteTransactionsBySourceFile(fileName);

                // Remove from uploaded files list
                setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));

                // Reload transactions from storage
                const remainingTransactions = transactions.filter(
                    (t: Transaction) => t.sourceFile !== fileName
                );
                setTransactions(remainingTransactions);
            } catch (error) {
                console.error("Error deleting file:", error);
                setUploadError("Failed to delete file data");
            }
        },
        [transactions, setTransactions]
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Upload Bank Statement
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Upload your password-protected Excel bank statements to analyze your finances
                </p>
            </div>

            {/* Privacy Notice */}
            <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                        <div>
                            <h3 className="font-medium text-green-900 dark:text-green-100">
                                Your Privacy is Protected
                            </h3>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                All file processing happens entirely in your browser. Your bank statements
                                and financial data never leave your device or get uploaded to any server.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Success Message */}
            {lastUploadInfo && !uploadError && (
                <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                            <div className="flex-1">
                                <h3 className="font-medium text-green-900 dark:text-green-100">
                                    Upload Successful!
                                </h3>
                                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                    Processed {lastUploadInfo.count} transactions from {lastUploadInfo.fileName}
                                </p>
                                {lastUploadInfo.newTransactions > 0 && (
                                    <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                        ✓ Added {lastUploadInfo.newTransactions} new transaction{lastUploadInfo.newTransactions !== 1 ? 's' : ''}
                                    </p>
                                )}
                                {lastUploadInfo.duplicatesRemoved > 0 && (
                                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                        ⓘ Skipped {lastUploadInfo.duplicatesRemoved} duplicate{lastUploadInfo.duplicatesRemoved !== 1 ? 's' : ''} (already in your data)
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                    Date range: {lastUploadInfo.dateRange.start.toLocaleDateString()} to{" "}
                                    {lastUploadInfo.dateRange.end.toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Error Message */}
            {uploadError && (
                <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                            <div>
                                <h3 className="font-medium text-red-900 dark:text-red-100">
                                    Upload Failed
                                </h3>
                                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                    {uploadError}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Upload Component */}
            <Card className="mb-6">
                <div className="p-6">
                    <FileUpload
                        onFileSelect={handleFileSelect}
                        uploadedFiles={uploadedFiles.map(f => f.name)}
                        maxFileSize={10 * 1024 * 1024}
                    />
                </div>
            </Card>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <Card className="mb-6">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                                Uploaded Files ({uploadedFiles.length})
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total: {transactions.length} transactions
                            </p>
                        </div>
                        <div className="space-y-3">
                            {uploadedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-start justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                >
                                    <div className="flex items-start gap-3">
                                        <FileCheck className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {file.name}
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {file.transactionCount} transactions
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {file.dateRange.start.toLocaleDateString()} - {file.dateRange.end.toLocaleDateString()}
                                                </span>
                                                <span className="text-gray-400">
                                                    Uploaded {file.uploadedAt.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm(`Delete "${file.name}" and all its transactions?`)) {
                                                handleDeleteFile(file.name);
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            💡 Tip: You can upload multiple years of data. Duplicate transactions are automatically removed.
                        </p>
                    </div>
                </Card>
            )}

            {/* Current Status */}
            {transactions.length > 0 && (
                <Card>
                    <div className="p-6">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    Current Data
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {transactions.length} transactions loaded
                                </p>
                                {uploadedFiles.length > 0 && (
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                        {uploadedFiles.length} file(s) uploaded
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Instructions */}
            <Card className="mt-6">
                <div className="p-6">
                    <h3 className="mb-4 font-medium text-gray-900 dark:text-white">
                        How to Upload
                    </h3>
                    <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                                1
                            </span>
                            <span>
                                Download your bank statement in Excel format (.xlsx) from your bank's
                                website
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                                2
                            </span>
                            <span>
                                Click the upload area above or drag and drop your Excel file
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                                3
                            </span>
                            <span>
                                If your file is password-protected, enter the password when prompted
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                                4
                            </span>
                            <span>
                                Your transactions will be automatically parsed, categorized, and stored
                                locally
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                                5
                            </span>
                            <span>
                                You can upload multiple statements - duplicate transactions will be
                                automatically removed
                            </span>
                        </li>
                    </ol>
                </div>
            </Card>

            {/* Supported Formats */}
            <Card className="mt-6">
                <div className="p-6">
                    <h3 className="mb-4 font-medium text-gray-900 dark:text-white">
                        Supported Formats
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>SBI Bank Excel statements (.xlsx)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>Password-protected Excel files</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>Multiple statement files (automatic deduplication)</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

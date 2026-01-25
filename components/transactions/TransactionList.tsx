"use client";

import { useState } from "react";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    CheckCircle,
    Circle,
    MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import TransactionDetail from "./TransactionDetail";
import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";

interface TransactionListProps {
    transactions: Transaction[];
    tags: Tag[];
    totalCount: number;
    filteredCount: number;
}

export default function TransactionList({
    transactions,
    tags,
    totalCount,
    filteredCount,
}: TransactionListProps) {
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);
    const [sortBy, setSortBy] = useState<"date" | "amount">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Sort transactions
    const sortedTransactions = [...transactions].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "date") {
            comparison = a.date.getTime() - b.date.getTime();
        } else {
            comparison = a.amount - b.amount;
        }
        return sortOrder === "asc" ? comparison : -comparison;
    });

    const toggleSort = (field: "date" | "amount") => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    const getTagsForTransaction = (transaction: Transaction) => {
        return tags.filter((tag) => transaction.tagIds.includes(tag.id));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {filteredCount === totalCount
                                ? `${totalCount} Transactions`
                                : `${filteredCount} of ${totalCount} Transactions`}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent>
                    {sortedTransactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No transactions found</p>
                            <p className="text-sm mt-2">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleSort("date")}
                                                className="h-8 px-2"
                                            >
                                                Date
                                                {sortBy === "date" && (
                                                    <span className="ml-1">
                                                        {sortOrder === "asc" ? "↑" : "↓"}
                                                    </span>
                                                )}
                                            </Button>
                                        </TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Categories</TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleSort("amount")}
                                                className="h-8 px-2"
                                            >
                                                Amount
                                                {sortBy === "amount" && (
                                                    <span className="ml-1">
                                                        {sortOrder === "asc" ? "↑" : "↓"}
                                                    </span>
                                                )}
                                            </Button>
                                        </TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTransactions.map((transaction) => {
                                        const transactionTags = getTagsForTransaction(transaction);
                                        return (
                                            <TableRow
                                                key={transaction.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => setSelectedTransaction(transaction)}
                                            >
                                                <TableCell>
                                                    {transaction.type === "credit" ? (
                                                        <ArrowUpCircle className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <ArrowDownCircle className="h-5 w-5 text-red-500" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {new Date(transaction.date).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-md">
                                                        <p className="font-medium truncate">
                                                            {transaction.details}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {transaction.refNo} • {transaction.paymentMethod}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {transactionTags.slice(0, 2).map((tag) => (
                                                            <Badge
                                                                key={tag.id}
                                                                variant="secondary"
                                                                className="text-xs"
                                                                style={{
                                                                    backgroundColor: `${tag.color}20`,
                                                                    color: tag.color,
                                                                    borderColor: tag.color,
                                                                }}
                                                            >
                                                                {tag.name}
                                                            </Badge>
                                                        ))}
                                                        {transactionTags.length > 2 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{transactionTags.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell
                                                    className={
                                                        transaction.type === "credit"
                                                            ? "text-green-600 font-semibold"
                                                            : "text-red-600 font-semibold"
                                                    }
                                                >
                                                    {transaction.type === "credit" ? "+" : "-"}
                                                    {formatCurrency(transaction.amount)}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(transaction.balance)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {transaction.isReviewed ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Circle className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedTransaction && (
                <TransactionDetail
                    transaction={selectedTransaction}
                    tags={tags}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </>
    );
}

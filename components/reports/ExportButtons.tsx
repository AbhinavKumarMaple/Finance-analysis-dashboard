"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadMonthlyReport, downloadYearlyReport } from "@/lib/reports/export";
import type { MonthlyReport, YearlyReport } from "@/types/analytics";
import { Download, FileText, FileJson } from "lucide-react";

interface ExportButtonsProps {
    reportType: "monthly" | "yearly";
    report: MonthlyReport | YearlyReport;
}

export function ExportButtons({ reportType, report }: ExportButtonsProps) {
    const handleExport = (format: "csv" | "json") => {
        if (reportType === "monthly") {
            downloadMonthlyReport(report as MonthlyReport, format);
        } else {
            downloadYearlyReport(report as YearlyReport, format);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Export as JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

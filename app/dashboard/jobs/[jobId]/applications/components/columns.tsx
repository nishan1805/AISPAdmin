"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, MoreVertical, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type JobApplication = {
    id: string;
    applicantSno: string;
    fullName: string;
    phoneNo: string;
    emailId: string;
    appliedOn: string;
    attachment: string;
    status: "New" | "Shortlisted" | "Interviewed" | "Rejected" | "Selected";
    notes: string;
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case "New":
            return "bg-blue-100 text-blue-700 hover:bg-blue-100";
        case "Shortlisted":
            return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
        case "Interviewed":
            return "bg-purple-100 text-purple-700 hover:bg-purple-100";
        case "Rejected":
            return "bg-red-100 text-red-700 hover:bg-red-100";
        case "Selected":
            return "bg-green-100 text-green-700 hover:bg-green-100";
        default:
            return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
};

export const getApplicationColumns = (
    onUpdateStatus: (row: JobApplication) => void,
    onDelete?: (id: string) => void
) => [
        {
            key: "select",
            label: "",
        },
        {
            key: "serialNo",
            label: "S.No.",
            render: (_: JobApplication, index: number) => index + 1,
        },
        {
            key: "applicantSno",
            label: "Applicant S.No.",
        },
        {
            key: "fullName",
            label: "Full Name",
        },
        {
            key: "phoneNo",
            label: "Phone No.",
        },
        {
            key: "emailId",
            label: "Email ID",
        },
        {
            key: "appliedOn",
            label: "Applied On",
        },
        {
            key: "attachment",
            label: "Attachment",
            render: (row: JobApplication) => (
                <div className="flex items-center text-slate-600">
                    <FileText size={16} className="mr-1" />
                    {row.attachment ? (
                        <a
                            href={row.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center"
                        >
                            <Download size={14} className="mr-1" />
                            PDF
                        </a>
                    ) : (
                        <span className="text-slate-400">No File</span>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (row: JobApplication) => (
                <Badge className={getStatusBadgeClass(row.status)}>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "actions",
            label: "",
            render: (row: JobApplication) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical size={18} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onUpdateStatus(row)}>
                            Update Status
                        </DropdownMenuItem>
                        {row.attachment && (
                            <DropdownMenuItem
                                onClick={() => {
                                    window.open(row.attachment, "_blank");
                                }}
                            >
                                Download Resume
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                                if (typeof onDelete === "function") onDelete(row.id);
                            }}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
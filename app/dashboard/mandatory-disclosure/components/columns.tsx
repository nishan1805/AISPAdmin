"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText, MoreVertical, Dot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/date";

export type Disclosure = {
  id: string;
  docId: string;
  title: string;
  description?: string;
  attachment: string;
  createdAt: string;
  updatedAt?: string;
  photosCount?: number;
  status: "New" | "Posted" | "Deleted";
  visibility: boolean;
};

export const getColumns = (
  onToggleVisibility: (id: string, value: boolean) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: Disclosure) => void
) => [
  {
    key: "select",
    label: "",
  },
  {
    key: "serialNo",
    label: "S.No.",
    render: (_: Disclosure, index: number) => index + 1,
  },
  {
    key: "title",
    label: "Title",
  },
  {
    key: "status",
    label: "Status",
    render: (row: Disclosure) => {
      const status = row.status;
      const badgeClass =
        status === "New"
          ? "bg-green-100 text-green-700 hover:bg-green-100"
          : status === "Posted"
          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
          : "bg-red-100 text-red-700 hover:bg-red-100";

      return (
        <Badge className={badgeClass}>
          <Dot />
          {status}
        </Badge>
      );
    },
  },
  {
    key: "attachment",
    label: "Attachment",
    render: (row: Disclosure) => (
      <div className="flex items-center text-slate-600">
        <FileText size={16} className="mr-1" />
        {row.attachment ? (
          <a
            href={row.attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            View File
          </a>
        ) : (
          <span className="text-slate-400">No File</span>
        )}
      </div>
    ),
  },
  {
    key: "visibility",
    label: "Visibility",
    render: (row: Disclosure) => (
      <Switch
        checked={row.visibility}
        onCheckedChange={(checked) => onToggleVisibility(row.id, checked)}
      />
    ),
  },
  {
    key: "createdAt",
    label: "Created Date & Time",
    render: (row: Disclosure) => formatDateTime(row.createdAt),
  },
  {
    key: "updatedAt",
    label: "Updated Date & Time",
    render: (row: Disclosure) =>
      row.updatedAt ? formatDateTime(row.updatedAt) : "-",
  },
  {
    key: "actions",
    label: "",
    render: (row: Disclosure) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              if (typeof onEdit === "function") onEdit(row);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              window.open(row.attachment, "_blank");
            }}
          >
            View
          </DropdownMenuItem>
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

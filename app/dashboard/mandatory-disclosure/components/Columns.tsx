"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Disclosure = {
  id: string;
  docId: string;
  title: string;
  attachment: string;
  createdAt: string;
  photosCount?: number;
  status: "New" | "Posted" | "Deleted";
  visibility: boolean;
};

export const columns = [
  { key: "select", label: "" },
  { key: "docId", label: "Doc ID" },
  { key: "title", label: "Title" },
  {
    key: "attachment",
    label: "Attachment",
    render: (row: Disclosure) => (
      <div className="flex items-center">
        <FileText size={16} className="mr-2 text-slate-600" />
        <span className="text-slate-600">PDF</span>
      </div>
    ),
  },
  { key: "createdAt", label: "Created Date & Time" },
  { key: "photosCount", label: "# Photos" },
  {
    key: "status",
    label: "Status",
    render: (row: Disclosure) => {
      const status = row.status;
      const cls =
        status === "New"
          ? "bg-green-100 text-green-700"
          : status === "Posted"
          ? "bg-blue-100 text-blue-700"
          : "bg-red-100 text-red-700";
      return <Badge className={cls}>{status}</Badge>;
    },
  },
  {
    key: "visibility",
    label: "Visibility",
    render: (row: Disclosure) => <Switch checked={row.visibility} />,
  },
  {
    key: "actions",
    label: "",
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

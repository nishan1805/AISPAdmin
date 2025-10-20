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

export type Update = {
  id: string; // 👈 Added ID for selection
  postId: string;
  title: string;
  createdDate: string;
  status: "New" | "Posted" | "Deleted";
  attachment: string;
  visibility: boolean;
  updatedDate: string;
};

export const columns = [
  {
    key: "select",
    label: "",
  },
  {
    key: "postId",
    label: "Post ID",
  },
  {
    key: "title",
    label: "Title",
  },
  {
    key: "createdDate",
    label: "Created Date & Time",
  },
  {
    key: "status",
    label: "Status",
    render: (row: Update) => {
      const status = row.status;
      const badgeClass =
        status === "New"
          ? "bg-green-100 text-green-700 hover:bg-green-100"
          : status === "Posted"
          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
          : "bg-red-100 text-red-700 hover:bg-red-100";
      return <Badge className={badgeClass}>{status}</Badge>;
    },
  },
  {
    key: "attachment",
    label: "Attachment",
    render: (row: Update) => (
      <div className="flex items-center text-slate-600">
        <FileText size={16} className="mr-1" />
        {row.attachment}
      </div>
    ),
  },
  {
    key: "visibility",
    label: "Visibility",
    render: (row: Update) => <Switch checked={row.visibility} />,
  },
  {
    key: "updatedDate",
    label: "Updated Date & Time",
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

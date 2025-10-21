"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText, MoreVertical , Dot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {formatDateTime} from "@/lib/date"
import { LatestUpdate } from "@/lib/status";

export type Update = {
  id: string;
  postId: string;
  title: string;
  createdDate: string;
  status: LatestUpdate;
  attachment: string;
  visibility: boolean;
  updatedDate: string;
};
export const getColumns = (
  onToggleVisibility: (id: string, value: boolean) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: Update) => void,
) => [
  {
    key: "select",
    label: "",
  },
  {
    key: "serialNo",
    label: "S.No.",
    render: (_: Update, index: number) => index + 1,
  },
  {
    key: "title",
    label: "Title",
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
      return <Badge className={badgeClass}><Dot/>{status}</Badge>;
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
  render: (row: Update) => (
    <Switch
      checked={row.visibility}
      onCheckedChange={(checked) => onToggleVisibility(row.id, row.visibility)}
      className={`${
    row.visibility ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-gray-300"
  }`}

    />
  ),
},
 {
    key: "createdDate",
    label: "Created Date & Time",
    render: (row: Update) => formatDateTime(row.createdDate),
  },
  {
    key: "updatedDate",
    label: "Updated Date & Time",
    render: (row: Update) => formatDateTime(row.updatedDate),
  },
  {
    key: "actions",
    label: "",
    render: (row: Update) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { if (typeof onEdit === "function") onEdit(row); }}>Edit</DropdownMenuItem>
          <DropdownMenuItem>View</DropdownMenuItem>
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

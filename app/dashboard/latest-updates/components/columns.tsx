"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
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
  postId: string;
  title: string;
  createdDate: string;
  status: "New" | "Posted" | "Deleted";
  attachment: string;
  visibility: boolean;
  updatedDate: string;
};

export const columns: ColumnDef<Update>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "postId",
    header: "Post ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("postId")}</div>,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-md truncate" title={row.getValue("title")}>
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "createdDate",
    header: "Created Date & Time",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Update["status"];
      const badgeClass =
        status === "New"
          ? "bg-green-100 text-green-700 hover:bg-green-100"
          : status === "Posted"
          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
          : "bg-red-100 text-red-700 hover:bg-red-100";
      return (
        <Badge className={badgeClass}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "attachment",
    header: "Attachment",
    cell: ({ row }) => (
      <div className="flex items-center text-slate-600">
        <FileText size={16} className="mr-1" />
        {row.getValue("attachment")}
      </div>
    ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => (
      <Switch checked={row.getValue("visibility") as boolean} />
    ),
  },
  {
    accessorKey: "updatedDate",
    header: "Updated Date & Time",
  },
  {
    id: "actions",
    header: "",
    cell: () => (
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

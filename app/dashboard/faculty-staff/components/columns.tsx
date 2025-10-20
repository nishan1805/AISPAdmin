"use client";

import { Switch } from "@/components/ui/switch";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Staff = {
  id: string;
  docId: string;
  name: string;
  designation: string;
  category: string;
  visibility: boolean;
};

export const columns = [
  { key: "select", label: "" },
  { key: "docId", label: "Doc ID" },
  { key: "name", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "category", label: "Category" },
  {
    key: "visibility",
    label: "Visibility",
    render: (row: Staff) => <Switch checked={row.visibility} />,
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

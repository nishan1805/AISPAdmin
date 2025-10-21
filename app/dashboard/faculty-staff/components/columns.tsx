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
import { render } from "react-dom";

export type Staff = {
  id: string;
  image_url: string;
  name: string;
  designation: string;
  category: string;
  visibility: boolean;
};

export const getStaffColumns = (
  onToggleVisibility: (id: string, value: boolean) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: Staff) => void
) => [
    { key: "select", label: "" },
    {
      key: "image_url", label: "Photo",
      render: (row: Staff) => (
        <img
          src={row.image_url}
          alt={row.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      ),
    },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "category", label: "Category" },
    {
      key: "visibility",
      label: "Visibility",
      render: (row: Staff) => (
        <Switch
          checked={row.visibility}
          onCheckedChange={() => onToggleVisibility(row.id, row.visibility)}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row: Staff) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(row)}>Edit</DropdownMenuItem>
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete?.(row.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

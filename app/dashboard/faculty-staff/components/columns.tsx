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
      key: "serialNo",
      label: "S.No.",
      render: (_: Staff, index: number) => index + 1,
    },
    { key: "docId", label: "Doc ID" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "category", label: "Category" },
    {
      key: "visibility",
      label: "Visibility",
      render: (row: Staff) => (
        <Switch
          checked={row.visibility}
          onCheckedChange={(checked) => onToggleVisibility(row.id, checked)}
          className={`${row.visibility ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-gray-300"
            }`}
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

"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPermissions } from "@/hooks/use-user-permissions";

export type UserRole = {
  id: string;
  userId?: string;
  name: string;
  role: "Administrator" | "Editor";
  accessLevel: "Administrator" | "Editor";
};

export const getUserRoleColumns = (
  onDelete?: (id: string) => void,
  onEdit?: (row: UserRole) => void,
  permissions?: UserPermissions | null,
) => [
    { key: "select", label: "" },
    {
      key: "serialNo",
      label: "S.No.",
      render: (_: UserRole, index: number) => index + 1,
    },
    { key: "userId", label: "User ID" },
    { key: "name", label: "Name" },
    { key: "accessLevel", label: "Role" },
    {
      key: "actions",
      label: "",
      render: (row: UserRole) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {permissions?.canEdit && (
              <DropdownMenuItem onClick={() => { if (typeof onEdit === "function") onEdit(row); }}>
                Edit
              </DropdownMenuItem>
            )}
            {permissions?.canDelete && (
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  if (typeof onDelete === "function") onDelete(row.id);
                }}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

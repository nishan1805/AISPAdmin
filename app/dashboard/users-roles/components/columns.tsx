"use client";

import { Badge } from "@/components/ui/badge";
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
  userId: string;
  name: string;
  email?: string;
  role: string;
  department: string;
  accessLevel: string;
  status: "Invited" | "Active" | "Inactive";
  lastSignIn?: string | null;
  emailConfirmed?: boolean;
};

export const getUserRoleColumns = (
  onToggleStatus: (id: string, currentStatus: string) => void,
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
    { key: "email", label: "Email" },
    { key: "accessLevel", label: "Role" },
    {
      key: "status",
      label: "Status",
      render: (row: UserRole) => {
        const styles =
          row.status === "Active"
            ? "bg-green-100 text-green-700 cursor-pointer"
            : row.status === "Invited"
              ? "bg-amber-100 text-amber-700 cursor-pointer"
              : "bg-red-100 text-red-700 cursor-pointer";

        return (
          <Badge
            className={styles}
            onClick={() => permissions?.canEdit && onToggleStatus(row.id, row.status)}
          >
            {row.status}
          </Badge>
        );
      },
    },
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

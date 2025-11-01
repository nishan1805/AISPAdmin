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

export type UserRole = {
  id: string;
  userId: string;
  name: string;
  role: string;
  department: string;
  accessLevel: string;
  status: "Active" | "Inactive";
};

export const getUserRoleColumns = (
  onToggleStatus: (id: string, currentStatus: string) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: UserRole) => void,
) => [
    { key: "select", label: "" },
    {
      key: "serialNo",
      label: "S.No.",
      render: (_: UserRole, index: number) => index + 1,
    },
    { key: "userId", label: "User ID" },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "department", label: "Department" },
    { key: "accessLevel", label: "Access Level" },
    {
      key: "status",
      label: "Status",
      render: (row: UserRole) => (
        <Badge
          className={row.status === "Active" ? "bg-green-100 text-green-700 cursor-pointer" : "bg-red-100 text-red-700 cursor-pointer"}
          onClick={() => onToggleStatus(row.id, row.status)}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row: UserRole) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
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

export const columns = [
  { key: "select", label: "" },
  { key: "userId", label: "User ID" },
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "department", label: "Department" },
  { key: "accessLevel", label: "Access Level" },
  {
    key: "status",
    label: "Status",
    render: (row: UserRole) => (
      <Badge className={row.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{row.status}</Badge>
    ),
  },
  {
    key: "actions",
    label: "",
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
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

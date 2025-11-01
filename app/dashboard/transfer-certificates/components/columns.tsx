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

export type TC = {
  id: string;
  admissionNo: string;
  studentName: string;
  dob: string;
  issueDate: string;
  fileName: string;
  visibility: boolean;
  updatedAt: string;
};

export const getTCColumns = (
  onToggleVisibility: (id: string, value: boolean) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: TC) => void,
) => [
    { key: "select", label: "" },
    {
      key: "serialNo",
      label: "S.No.",
      render: (_: TC, index: number) => index + 1,
    },
    { key: "admissionNo", label: "Admission No." },
    { key: "studentName", label: "Student Name" },
    { key: "dob", label: "Date of Birth (DOB)" },
    { key: "issueDate", label: "TC Issue Date" },
    {
      key: "fileName",
      label: "File",
      render: (row: TC) => (
        <div className="flex items-center">
          <FileText size={16} className="mr-2 text-slate-600" />
          <span className="text-slate-600">{row.fileName}</span>
        </div>
      ),
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (row: TC) => (
        <Switch
          checked={row.visibility}
          onCheckedChange={(checked) => onToggleVisibility(row.id, row.visibility)}
          className={`${row.visibility ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-gray-300"
            }`}
        />
      ),
    },
    { key: "updatedAt", label: "Updated Date & Time" },
    {
      key: "actions",
      label: "",
      render: (row: TC) => (
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
  { key: "admissionNo", label: "Admission No." },
  { key: "studentName", label: "Student Name" },
  { key: "dob", label: "Date of Birth (DOB)" },
  { key: "issueDate", label: "TC Issue Date" },
  {
    key: "fileName",
    label: "File",
    render: (row: TC) => (
      <div className="flex items-center">
        <FileText size={16} className="mr-2 text-slate-600" />
        <span className="text-slate-600">{row.fileName}</span>
      </div>
    ),
  },
  {
    key: "visibility",
    label: "Visibility",
    render: (row: TC) => <Switch checked={row.visibility} />,
  },
  { key: "updatedAt", label: "Updated Date & Time" },
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

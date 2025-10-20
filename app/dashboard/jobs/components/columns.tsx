"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Briefcase, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Job = {
  id: string;
  jobId: string;
  title: string;
  department: string;
  postedDate: string;
  lastDateToApply: string;
  jobType: string;
  status: "Open" | "Closed";
  visibility: boolean;
};

export const columns = [
  { key: "select", label: "" },
  { key: "jobId", label: "Job ID" },
  { key: "title", label: "Title / Job Role" },
  { key: "department", label: "Department" },
  { key: "postedDate", label: "Posted Date" },
  { key: "lastDateToApply", label: "Last Date to Apply" },
  { key: "jobType", label: "Job Type" },
  {
    key: "status",
    label: "Status",
    render: (row: Job) => <Badge className={row.status === "Open" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{row.status}</Badge>,
  },
  {
    key: "visibility",
    label: "Visibility",
    render: (row: Job) => <Switch checked={row.visibility} />,
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

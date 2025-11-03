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
  subject: string;
  department: string;
  lastDateToApply: string;
  jobType: string;
  status: "Open" | "Closed";
  visibility: boolean;
  applicantsCount?: number;
};

export const getJobColumns = (
  onToggleVisibility: (id: string, value: boolean) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: Job) => void,
  onViewApplications?: (row: Job) => void,
) => [
    { key: "select", label: "" },
    {
      key: "serialNo",
      label: "S.No.",
      render: (_: Job, index: number) => index + 1,
    },
    { key: "jobId", label: "Job ID" },
    {
      key: "title",
      label: "Job Title",
      render: (row: Job) => (
        <button
          onClick={() => { if (typeof onViewApplications === "function") onViewApplications(row); }}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
        >
          {row.title}
        </button>
      ),
    },
    { key: "subject", label: "Subject" },
    { key: "department", label: "Department" },
    {
      key: "applicantsCount",
      label: "#No. of applicants",
      render: (row: Job) => (
        <span className="font-medium">
          {row.applicantsCount || 0}
        </span>
      ),
    },
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
      render: (row: Job) => (
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
      render: (row: Job) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { if (typeof onEdit === "function") onEdit(row); }}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { if (typeof onViewApplications === "function") onViewApplications(row); }}>View Applications</DropdownMenuItem>
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

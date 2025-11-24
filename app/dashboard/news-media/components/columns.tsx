"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NewsItem = {
  id: string;
  postId: string;
  cover: string;
  title: string;
  eventDate: string;
  source: string | number;
  status: "New" | "Posted" | "Deleted";
  visibility: boolean;
};

export const getNewsMediaColumns = (
  onToggleVisibility: (id: string, value: boolean) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: NewsItem) => void,
  onView?: (row: NewsItem) => void,
) => [
    { key: "select", label: "" },
    {
      key: "serialNo",
      label: "S.No.",
      render: (_: NewsItem, index: number) => index + 1,
    },
    { key: "postId", label: "Post ID" },
    {
      key: "cover",
      label: "Cover (thumbnail)",
      render: (row: NewsItem) => (
        <div className="flex items-center">
          <ImageIcon size={16} className="mr-2 text-slate-600" />
          <span className="text-slate-600">Img</span>
        </div>
      ),
    },
    { key: "title", label: "Title" },
    { key: "eventDate", label: "Event Date" },
    { key: "source", label: "Source" },
    {
      key: "status",
      label: "Status",
      render: (row: NewsItem) => {
        const status = row.status;
        const cls =
          status === "New"
            ? "bg-green-100 text-green-700"
            : status === "Posted"
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700";
        return <Badge className={cls}>{status}</Badge>;
      },
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (row: NewsItem) => (
        <Switch
          checked={row.visibility}
          onCheckedChange={(checked) => onToggleVisibility(row.id, row.visibility)}
          className={`${row.visibility ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-gray-300"
            }`}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row: NewsItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { if (typeof onEdit === "function") onEdit(row); }}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { if (typeof onView === "function") onView(row); }}>View</DropdownMenuItem>
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
  { key: "postId", label: "Post ID" },
  {
    key: "cover",
    label: "Cover (thumbnail)",
    render: (row: NewsItem) => (
      <div className="flex items-center">
        <ImageIcon size={16} className="mr-2 text-slate-600" />
        <span className="text-slate-600">Img</span>
      </div>
    ),
  },
  { key: "title", label: "Title" },
  { key: "eventDate", label: "Event Date" },
  { key: "source", label: "Source" },
  {
    key: "status",
    label: "Status",
    render: (row: NewsItem) => {
      const status = row.status;
      const cls =
        status === "New"
          ? "bg-green-100 text-green-700"
          : status === "Posted"
            ? "bg-blue-100 text-blue-700"
            : "bg-red-100 text-red-700";
      return <Badge className={cls}>{status}</Badge>;
    },
  },
  {
    key: "visibility",
    label: "Visibility",
    render: (row: NewsItem) => <Switch checked={row.visibility} />,
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

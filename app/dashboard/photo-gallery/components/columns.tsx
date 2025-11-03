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

export type Photo = {
  id: string;
  galleryId: string;
  cover: string;
  title: string;
  eventDate: string;
  photosCount: number;
  status: "New" | "Posted" | "Deleted";
  visibility: boolean;
};

export const getGalleryColumns = (
  onToggleVisibility: (id: string, value: boolean) => void,
  onDelete?: (id: string) => void,
  onEdit?: (row: Photo) => void,
) => [
    { key: "select", label: "" },
    {
      key: "serialNo",
      label: "S.No.",
      render: (_: Photo, index: number) => index + 1,
    },
    { key: "galleryId", label: "Gallery ID" },
    {
      key: "cover",
      label: "Cover (thumbnail)",
      render: (row: Photo) => (
        <div className="flex items-center">
          {row.cover ? (
            <a href={row.cover} target="_blank" rel="noopener noreferrer" title="Open image" className="text-slate-600 hover:text-slate-800">
              <ImageIcon size={18} />
            </a>
          ) : (
            <div className="text-slate-600 flex items-center gap-2"><ImageIcon size={16} /> <span>Img</span></div>
          )}
        </div>
      ),
    },
    { key: "title", label: "Title / Album Name" },
    { key: "eventDate", label: "Event Date" },
    { key: "photosCount", label: "# Photos" },
    {
      key: "status",
      label: "Status",
      render: (row: Photo) => {
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
      render: (row: Photo) => (
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
      render: (row: Photo) => (
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
  { key: "galleryId", label: "Gallery ID" },
  {
    key: "cover",
    label: "Cover (thumbnail)",
    render: (row: Photo) => (
      <div className="flex items-center">
        {row.cover ? (
          <a href={row.cover} target="_blank" rel="noopener noreferrer" title="Open image" className="text-slate-600 hover:text-slate-800">
            <ImageIcon size={18} />
          </a>
        ) : (
          <div className="text-slate-600 flex items-center gap-2"><ImageIcon size={16} /> <span>Img</span></div>
        )}
      </div>
    ),
  },
  { key: "title", label: "Title / Album Name" },
  { key: "eventDate", label: "Event Date" },
  { key: "photosCount", label: "# Photos" },
  {
    key: "status",
    label: "Status",
    render: (row: Photo) => {
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
    render: (row: Photo) => <Switch checked={row.visibility} />,
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

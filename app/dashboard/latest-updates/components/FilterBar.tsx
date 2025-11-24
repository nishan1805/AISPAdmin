"use client";

import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterBarProps {
  onSearch: (query: string) => void;
  onAdd?: () => void;
  onDeleteSelected?: () => void;
}

export default function FilterBar({ onSearch, onAdd, onDeleteSelected }: FilterBarProps) {
  return (
    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Button
          onClick={() => {
            if (typeof (onAdd as any) === "function") onAdd!();
          }}
        >
          <Plus size={18} className="mr-2" />
          Add New
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Bulk Action</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                if (typeof (onDeleteSelected as any) === "function") onDeleteSelected!();
              }}
            >
              Delete Selected
            </DropdownMenuItem>
            <DropdownMenuItem>Export Selected</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            placeholder="Search"
            className="pl-10 w-64"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter size={18} />
        </Button>
      </div>
    </div>
  );
}

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
import { UserPermissions } from "@/hooks/use-user-permissions";

interface FilterBarProps {
  onSearch: (query: string) => void;
  onAdd?: () => void;
  onDeleteSelected?: () => void;
  permissions?: UserPermissions | null;
}

export default function FilterBar({ onSearch, onAdd, onDeleteSelected, permissions }: FilterBarProps) {
  // Debug: Log permissions to console
  console.log('FilterBar permissions:', permissions);

  return (
    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* Debug: Show permissions status */}
        <div className="text-xs text-gray-500 mr-4">
          Role: {permissions?.role || 'None'} | Can Manage: {permissions?.canManageUsers ? 'Yes' : 'No'}
        </div>

        {/* Temporary: Always show Add User button for debugging */}
        <Button
          onClick={() => {
            if (typeof onAdd === "function") onAdd();
          }}
          variant={permissions?.canManageUsers ? "default" : "outline"}
        >
          <Plus size={18} className="mr-2" />
          Add User {permissions?.canManageUsers ? '(Admin)' : '(Debug)'}
        </Button>

        {permissions?.canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Bulk Action</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  if (typeof onDeleteSelected === "function") onDeleteSelected();
                }}
              >
                Delete Selected
              </DropdownMenuItem>
              <DropdownMenuItem>Export Selected</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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

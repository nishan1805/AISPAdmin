"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { getUserRoleColumns, UserRole } from "./components/columns";
import AddUserDialog from "./components/AddUserDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
import { useUserPermissions } from "@/hooks/use-user-permissions";

type ActionType = "delete" | null;

const normalizeRole = (value?: string | null): "Administrator" | "Editor" => {
  const role = String(value || "").toLowerCase();
  return role === "administrator" || role === "admin" ? "Administrator" : "Editor";
};

export default function UsersRolesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<UserRole[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profilesApiMissing, setProfilesApiMissing] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  const { permissions, loading: permissionsLoading } = useUserPermissions();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setProfilesApiMissing(false);

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    let query = supabase
      .from(Tables.Profiles)
      .select("id, full_name, role, created_at", { count: "exact" })
      .order("created_at", { ascending: false });

    if (searchQuery.trim()) {
      query = query.ilike("full_name", `%${searchQuery.trim()}%`);
    }

    const { data: rows, error, count } = await query.range(from, to);

    if (error) {
      console.error("Failed to fetch profiles:", error);
      const statusCode = (error as any)?.status;
      const message = String((error as any)?.message || "");
      const code = String((error as any)?.code || "");
      const isNotFound =
        statusCode === 404 ||
        code === "PGRST205" ||
        message.toLowerCase().includes("could not find the table");

      if (isNotFound) {
        setProfilesApiMissing(true);
        toast.error("profiles API/table not found (404). Check Supabase schema exposure.");
      } else {
        toast.error("Failed to fetch users");
      }

      setData([]);
    } else {
      const usersWithData: UserRole[] = (rows || []).map((profile: any) => {
        const mappedRole = normalizeRole(profile.role);

        return {
          id: String(profile.id ?? ""),
          userId: String(profile.id ?? ""),
          name: profile.full_name ?? "",
          role: mappedRole,
          accessLevel: mappedRole,
        };
      });

      setData(usersWithData);
    }

    if (count !== null && count !== undefined) setTotalCount(count);
    setLoading(false);
  }, [page, rowsPerPage, searchQuery]);

  const handleRowSelect = (id: string | number, selected: boolean) => {
    setSelectedRows((prev) =>
      selected ? [...prev, id] : prev.filter((r) => r !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? data.map((row) => row.id) : []);
  };

  const handleDelete = (id: string) => {
    setConfirmTarget({ id });
    setConfirmActionType("delete");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmActionType !== "delete" || !confirmTarget) return;

    try {
      const { id } = confirmTarget;
      const { error } = await supabase.from(Tables.Profiles).delete().eq("id", id);

      if (error) throw error;

      toast.success("User deleted successfully");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    } finally {
      setConfirmDialogOpen(false);
      setConfirmActionType(null);
      setConfirmTarget(null);
    }
  };

  const deleteSelected = async () => {
    if (!selectedRows.length) {
      toast.error("No rows selected");
      return;
    }

    try {
      const ids = selectedRows.map((id) => String(id));
      const { error } = await supabase.from(Tables.Profiles).delete().in("id", ids);

      if (error) {
        console.error("Failed to delete selected users:", error);
        toast.error("Failed to delete selected items");
        return;
      }

      toast.success("Selected items deleted");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setSelectedRows([]);
    }
  };

  const handleEdit = async (row: UserRole) => {
    try {
      const { data: full, error } = await supabase
        .from(Tables.Profiles)
        .select("id, full_name, role")
        .eq("id", row.id)
        .single();

      if (error) {
        console.error("Failed to fetch profile for edit:", error);
        setEditTarget(row);
        setIsDialogOpen(true);
        return;
      }

      const initial = {
        id: full.id,
        name: full.full_name ?? row.name,
        accessLevel: normalizeRole(full.role ?? row.accessLevel),
      };

      setEditTarget(initial);
      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
      setEditTarget(row);
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (permissionsLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Users & Roles</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-600">Loading permissions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Users & Roles</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {profilesApiMissing && (
          <div className="mx-6 mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            `profiles` fetch is returning 404. Please verify that the table exists in Supabase and is exposed to PostgREST.
          </div>
        )}

        <FilterBar
          onSearch={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onAdd={permissions?.canManageUsers ? () => setIsDialogOpen(true) : undefined}
          onDeleteSelected={permissions?.canDelete ? deleteSelected : undefined}
          permissions={permissions}
        />

        <AddUserDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditTarget(null);
          }}
          onSuccess={fetchData}
          initialData={editTarget}
        />

        <ConfirmActionDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          title="Do you want to delete this user?"
          description="This cannot be undone"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleConfirmAction}
        />

        <DataTable
          columns={getUserRoleColumns(handleDelete, handleEdit, permissions)}
          data={data}
          totalRecords={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          isLoading={loading}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          onSelectAll={handleSelectAll}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

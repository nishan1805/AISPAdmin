"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { getUserRoleColumns, UserRole } from "./components/columns";
import AddUserDialog from "./components/AddUserDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
import { useUserPermissions } from "@/hooks/use-user-permissions";

type ActionType = "delete" | "status" | null;

export default function UsersRolesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<UserRole[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  const { permissions, loading: permissionsLoading } = useUserPermissions();

  // -------------------- Fetch Data --------------------
  const fetchData = async () => {
    setLoading(true);

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    const { data: rows, error, count } = await supabase
      .from(Tables.UsersRoles)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
      setData([]);
    } else {
      // Use data from users_roles table
      const usersWithData = (rows || []).map((user: any) => ({
        id: String(user.id ?? 0),
        userId: user.user_id ?? user.id ?? "",
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "",
        department: user.department ?? "",
        accessLevel: user.access_level ?? "",
        status: user.status ?? "Active",
        lastSignIn: null,
        emailConfirmed: false,
      }));

      setData(usersWithData);
    }

    if (count !== null && count !== undefined) setTotalCount(count);
    setLoading(false);
  };

  // -------------------- Table Row Selection --------------------
  const handleRowSelect = (id: string | number, selected: boolean) => {
    setSelectedRows((prev) =>
      selected ? [...prev, id] : prev.filter((r) => r !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? data.map((row) => row.id) : []);
  };

  // -------------------- Action Handlers --------------------
  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setConfirmTarget({ id, currentStatus, newStatus });
    setConfirmActionType("status");
    setConfirmDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmTarget({ id });
    setConfirmActionType("delete");
    setConfirmDialogOpen(true);
  };

  // -------------------- Confirm Action --------------------
  const handleConfirmAction = async () => {
    if (!confirmActionType || !confirmTarget) return;

    try {
      if (confirmActionType === "status") {
        const { id, newStatus } = confirmTarget;

        const { error } = await supabase
          .from(Tables.UsersRoles)
          .update({ status: newStatus })
          .eq("id", id);

        if (error) throw error;

        toast.success(`User ${newStatus.toLowerCase()}`);
      }

      if (confirmActionType === "delete") {
        const { id } = confirmTarget;
        const { error } = await supabase
          .from(Tables.UsersRoles)
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast.success("User deleted successfully");
      }

      // Refresh data after action
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

  // -------------------- Delete Multiple --------------------
  const deleteSelected = async () => {
    if (!selectedRows.length) {
      toast.error("No rows selected");
      return;
    }
    try {
      const ids = selectedRows.map((id) => String(id));
      const { error } = await supabase
        .from(Tables.UsersRoles)
        .delete()
        .in("id", ids);

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

  // -------------------- Edit Handler --------------------
  const handleEdit = async (row: UserRole) => {
    try {
      const { data: full, error } = await supabase
        .from(Tables.UsersRoles)
        .select("*")
        .eq("id", row.id)
        .single();

      if (error) {
        console.error("Failed to fetch record for edit:", error);
        setEditTarget(row);
        setIsDialogOpen(true);
        return;
      }

      const initial = {
        id: full.id,
        user_id: full.user_id,
        name: full.name ?? row.name,
        role: full.role ?? row.role,
        department: full.department ?? row.department,
        accessLevel: full.access_level ?? row.accessLevel,
        email: row.email ?? full.email ?? "",
      };

      setEditTarget(initial);
      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
      setEditTarget(row);
      setIsDialogOpen(true);
    }
  };

  // -------------------- Lifecycle --------------------
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  // -------------------- JSX --------------------
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
        <FilterBar
          onSearch={setSearchQuery}
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
          title={
            confirmActionType === "delete"
              ? "Do you want to delete this user?"
              : confirmTarget?.newStatus === "Active"
                ? "Activate this user?"
                : "Deactivate this user?"
          }
          description={
            confirmActionType === "delete"
              ? "This cannot be undone"
              : confirmTarget?.newStatus === "Active"
                ? "User will be able to access the system"
                : "User will no longer be able to access the system"
          }
          confirmLabel={
            confirmActionType === "delete"
              ? "Delete"
              : confirmTarget?.newStatus === "Active"
                ? "Activate"
                : "Deactivate"
          }
          variant={
            confirmActionType === "delete"
              ? "danger"
              : confirmTarget?.newStatus === "Inactive"
                ? "danger"
                : "success"
          }
          onConfirm={handleConfirmAction}
        />

        <DataTable
          columns={getUserRoleColumns(handleToggleStatus, handleDelete, handleEdit, permissions)}
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


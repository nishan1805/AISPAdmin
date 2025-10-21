"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { Staff, getStaffColumns } from "./components/columns";
import AddStaffDialog from "./components/AddStaffDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";

type ActionType = "delete" | "visibility" | null;

export default function FacultyStaffPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Staff[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  // -------------------- Fetch Data --------------------
  const fetchData = async () => {
    setLoading(true);
    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    const { data: rows, error, count } = await supabase
      .from(Tables.FacultyStaff)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    console.log("Fetched staff rows:", rows, "Error:", error, "Count:", count);

    if (error) {
      console.error("Failed to fetch staff:", error);
      setData([]);
    } else {
      setData(
        (rows || []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          image_url: r.image_url ?? r.image_url ?? "",
          name: r.name ?? "",
          designation: r.designation ?? "",
          category: r.category ?? "",
          visibility: !!r.visibility,
        }))
      );
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
  const handleToggleVisibility = (id: string, value: boolean) => {
    setConfirmTarget({ id, value });
    setConfirmActionType("visibility");
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
      if (confirmActionType === "visibility") {
        const { id, value } = confirmTarget;
        const { error } = await supabase
          .from(Tables.FacultyStaff)
          .update({ visibility: !value })
          .eq("id", id);
        if (error) throw error;

        toast.success(!value ? "Staff made visible" : "Staff hidden");
      }

      if (confirmActionType === "delete") {
        const { id } = confirmTarget;
        const { error } = await supabase
          .from(Tables.FacultyStaff)
          .delete()
          .eq("id", id);
        if (error) throw error;

        toast.success("Staff deleted successfully");
      }

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
        .from(Tables.FacultyStaff)
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Failed to delete selected staff:", error);
        toast.error("Failed to delete selected staff");
        return;
      }

      toast.success("Selected staff deleted");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setSelectedRows([]);
    }
  };

  // -------------------- Edit Handler --------------------
  const handleEdit = (row: Staff) => {
    setEditTarget(row);
    setIsDialogOpen(true);
  };

  // -------------------- Lifecycle --------------------
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  // -------------------- JSX --------------------
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Faculty & Staff</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar
          onSearch={setSearchQuery}
          onAdd={() => setIsDialogOpen(true)}
          onDeleteSelected={deleteSelected}
        />

        <AddStaffDialog
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
              ? "Do you want to delete this staff?"
              : confirmTarget?.value
              ? "Hide this staff from the website?"
              : "Show this staff on the website?"
          }
          description={
            confirmActionType === "delete"
              ? "This cannot be undone"
              : confirmTarget?.value
              ? "Users will no longer see them"
              : "Users will see them on the website"
          }
          confirmLabel={
            confirmActionType === "delete"
              ? "Delete"
              : confirmTarget?.value
              ? "Hide"
              : "Show"
          }
          variant={
            confirmActionType === "delete"
              ? "danger"
              : confirmTarget?.value
              ? "danger"
              : "success"
          }
          onConfirm={handleConfirmAction}
        />

        <DataTable
          columns={getStaffColumns(handleToggleVisibility, handleDelete, handleEdit)}
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

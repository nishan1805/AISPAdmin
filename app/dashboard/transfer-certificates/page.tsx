"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { getTCColumns, TC } from "./components/columns";
import AddTCDialog from "./components/AddTCDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";

type ActionType = "delete" | "visibility" | null;

export default function TransferCertificatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<TC[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  // -------------------- Fetch Data --------------------
  const fetchData = async () => {
    setLoading(true);

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    const { data: rows, error, count } = await supabase
      .from(Tables.TransferCertificates)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to fetch TCs:", error);
      toast.error("Failed to fetch transfer certificates");
      setData([]);
    } else {
      setData(
        (rows || []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          admissionNo: r.admission_no ?? "",
          studentName: r.student_name ?? "",
          dob: r.date_of_birth ?? "",
          issueDate: r.issue_date ?? "",
          fileName: r.file_url ? r.file_url.split('/').pop() : "",
          visibility: !!r.visibility,
          updatedAt: r.updated_at ?? "",
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
          .from(Tables.TransferCertificates)
          .update({ visibility: !value })
          .eq("id", id);

        if (error) throw error;

        toast.success(!value ? "Certificate made visible" : "Certificate hidden");
      }

      if (confirmActionType === "delete") {
        const { id } = confirmTarget;
        const { error } = await supabase
          .from(Tables.TransferCertificates)
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast.success("Certificate deleted successfully");
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
        .from(Tables.TransferCertificates)
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Failed to delete selected TCs:", error);
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
  const handleEdit = async (row: TC) => {
    try {
      const { data: full, error } = await supabase
        .from(Tables.TransferCertificates)
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
        admissionNo: full.admission_no ?? row.admissionNo,
        studentName: full.student_name ?? row.studentName,
        dob: full.date_of_birth ?? row.dob,
        issueDate: full.issue_date ?? row.issueDate,
        fileUrl: full.file_url ?? "",
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
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Transfer Certificates</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar
          onSearch={setSearchQuery}
          onAdd={() => setIsDialogOpen(true)}
          onDeleteSelected={deleteSelected}
        />

        <AddTCDialog
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
              ? "Do you want to delete this certificate?"
              : confirmTarget?.value
                ? "Hide this certificate from the website?"
                : "Show this certificate on the website?"
          }
          description={
            confirmActionType === "delete"
              ? "This cannot be undone"
              : confirmTarget?.value
                ? "Users will no longer see it"
                : "Users will see it on the website"
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
          columns={getTCColumns(handleToggleVisibility, handleDelete, handleEdit)}
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


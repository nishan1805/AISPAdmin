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
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  // -------------------- Fetch Data --------------------
  const fetchData = async () => {
    setLoading(true);

    let query = supabase
      .from(Tables.FacultyStaff)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply search filter
    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,designation.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,doc_id.ilike.%${searchQuery}%`);
    }

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;
    const { data: rows, error, count } = await query.range(from, to);

    console.log("Fetched staff rows:", rows, "Error:", error, "Count:", count);

    if (error) {
      console.error("Failed to fetch staff:", error);
      toast.error("Failed to fetch staff");
      setData([]);
    } else {
      setData(
        (rows || []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          docId: r.doc_id ?? `A-${String(r.id || idx + 1).padStart(3, '0')}`,
          image_url: r.image_url ?? "",
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
  const handleToggleVisibility = (id: string, targetValue: boolean) => {
    setConfirmTarget({ id, value: targetValue });
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
          .update({ visibility: value })
          .eq("id", id);
        if (error) throw error;

        toast.success(value ? "Staff made visible" : "Staff hidden");
      }

      if (confirmActionType === "delete") {
        const { id } = confirmTarget;

        // First, get the staff record to delete the associated file
        const { data: staffRecord, error: fetchError } = await supabase
          .from(Tables.FacultyStaff)
          .select("image_url")
          .eq("id", id)
          .single();

        if (fetchError) {
          console.warn("Could not fetch staff record for file cleanup:", fetchError);
        }

        // Delete the staff record
        const { error } = await supabase
          .from(Tables.FacultyStaff)
          .delete()
          .eq("id", id);
        if (error) throw error;

        // Clean up the file from storage
        if (staffRecord && staffRecord.image_url) {
          try {
            const fileUrl = staffRecord.image_url;
            const urlParts = fileUrl.split("/");
            const bucketIndex = urlParts.findIndex((part: string) => part === "AISPPUR");

            if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
              const filePath = urlParts.slice(bucketIndex + 1).join("/");
              const decodedPath = decodeURIComponent(filePath);

              const { error: storageError } = await supabase.storage
                .from("AISPPUR")
                .remove([decodedPath]);

              if (storageError) {
                console.warn("Could not delete file from storage:", storageError);
              }
            }
          } catch (e) {
            console.warn("Could not parse file URL:", staffRecord.image_url);
          }
        }

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

      // First, get all staff records to delete their associated files
      const { data: staffRecords, error: fetchError } = await supabase
        .from(Tables.FacultyStaff)
        .select("image_url")
        .in("id", ids);

      if (fetchError) {
        console.warn("Could not fetch staff records for file cleanup:", fetchError);
      }

      // Delete the staff records
      const { error } = await supabase
        .from(Tables.FacultyStaff)
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Failed to delete selected staff:", error);
        toast.error("Failed to delete selected staff");
        return;
      }

      // Clean up files from storage
      if (staffRecords && staffRecords.length > 0) {
        const filesToDelete: string[] = [];

        staffRecords.forEach((staff) => {
          if (staff.image_url) {
            try {
              const fileUrl = staff.image_url;
              const urlParts = fileUrl.split("/");
              const bucketIndex = urlParts.findIndex((part: string) => part === "AISPPUR");

              if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                const filePath = urlParts.slice(bucketIndex + 1).join("/");
                const decodedPath = decodeURIComponent(filePath);
                filesToDelete.push(decodedPath);
              }
            } catch (e) {
              console.warn("Could not parse file URL:", staff.image_url);
            }
          }
        });

        if (filesToDelete.length > 0) {
          try {
            const { error: storageError } = await supabase.storage
              .from("AISPPUR")
              .remove(filesToDelete);

            if (storageError) {
              console.warn("Some files could not be deleted from storage:", storageError);
            }
          } catch (storageErr) {
            console.warn("Could not delete files from storage:", storageErr);
          }
        }
      }

      toast.success("Selected staff deleted successfully");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setSelectedRows([]);
    }
  };

  // -------------------- Edit Handler --------------------
  const handleEdit = async (row: Staff) => {
    console.log("Edit button clicked for staff:", row);
    try {
      const { data: full, error } = await supabase
        .from(Tables.FacultyStaff)
        .select("*")
        .eq("id", row.id)
        .single();

      if (error) {
        console.error("Failed to fetch record for edit:", error);
        setEditTarget(row);
        setIsDialogOpen(true);
        return;
      }

      console.log("Fetched full record:", full);

      const initial = {
        id: full.id,
        name: full.name ?? row.name,
        designation: full.designation ?? row.designation,
        category: full.category ?? row.category,
        fileUrl: full.image_url ?? "",
      };

      console.log("Setting edit target:", initial);
      setEditTarget(initial);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Error in handleEdit:", err);
      setEditTarget(row);
      setIsDialogOpen(true);
    }
  };

  // -------------------- Lifecycle --------------------
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchQuery]);

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
                ? "Show this staff on the website?"
                : "Hide this staff from the website?"
          }
          description={
            confirmActionType === "delete"
              ? "This cannot be undone"
              : confirmTarget?.value
                ? "Users will see them on the website"
                : "Users will no longer see them"
          }
          confirmLabel={
            confirmActionType === "delete"
              ? "Delete"
              : confirmTarget?.value
                ? "Show"
                : "Hide"
          }
          variant={
            confirmActionType === "delete"
              ? "danger"
              : confirmTarget?.value
                ? "success"
                : "danger"
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

"use client";

import { useEffect, useState } from "react";
import { Update } from "./components/columns";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import AddUpdateDialog from "./components/AddUpdateDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { getColumns } from "./components/columns";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";

export default function LatestUpdatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Update[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [visibilityTarget, setVisibilityTarget] = useState<{ id: string; value: boolean } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from(Tables.LatestUpdates)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch updates:", error);
      setData([]);
    } else {
      setData(
        (rows || []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          postId: r.post_id ?? r.id ?? "",
          title: r.title ?? "",
          createdDate: r.created_at ?? "",
          status: (r.status as any) ?? "Posted",
          attachment: r.file_url ?? r.attachment ?? "",
          visibility: !!r.visibility,
          updatedDate: r.updated_at ?? r.created_at ?? "",
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = filteredData.length;
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleRowSelect = (id: string | number, selected: boolean) => {
    setSelectedRows((prev) =>
      selected ? [...prev, id] : prev.filter((r) => r !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? paginatedData.map((row) => row.id) : []);
  };
  // open confirmation when toggle switched
  const handleToggleVisibility = async (id: string, value: boolean) => {
    setVisibilityTarget({ id, value });
    setVisibilityDialogOpen(true);
  };

  const confirmToggleVisibility = async () => {
    if (!visibilityTarget) return;
    const { id, value } = visibilityTarget;
    try {
      const query = supabase.from(Tables.LatestUpdates).update({ visibility: value });
      const { error } = await query.eq("id", id);
      if (error) {
        console.error("Failed to update visibility:", error);
        toast.error("Failed to update visibility");
        return;
      }

      toast.success(value ? "Item will be visible" : "Item will be hidden");
      setVisibilityDialogOpen(false);
      setVisibilityTarget(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update visibility");
    }
  };

  const deleteSelected = async () => {
    if (!selectedRows || selectedRows.length === 0) {
      toast.error("No rows selected");
      return;
    }

    try {
      console.log("Deleting IDs:", selectedRows);
      const ids = selectedRows.map((id) => (typeof id === "string" ? id : String(id)));
      console.log("Mapped IDs for deletion:", ids);
      const { error } = await supabase.from(Tables.LatestUpdates).delete().in("id", ids);
      console.log("Deletion error:", error);
      if (error) {
        console.error("Failed to delete selected updates:", error);
        toast.error("Failed to delete selected items");
        return;
      }

      toast.success("Selected items deleted");
      setSelectedRows([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected items");
    }
  };

  // single item delete
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const ids = [deleteTargetId];
      const { error } = await supabase.from(Tables.LatestUpdates).delete().in("id", ids);
      if (error) {
        console.error("Failed to delete item:", error);
        toast.error("Failed to delete item");
        return;
      }

      toast.success("Item deleted");
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  const handleEdit = (row: Update) => {
    // Fetch full record from Supabase (to include description and file URL) then open dialog
    (async () => {
      try {
        const { data: full, error } = await supabase
          .from(Tables.LatestUpdates)
          .select("*")
          .eq("id", row.id)
          .single();
        if (error) {
          console.error("Failed to fetch record for edit:", error);
          // fallback to partial row
          setEditTarget(row);
          setIsDialogOpen(true);
          return;
        }

        const initial: any = {
          id: full.id,
          title: full.title ?? row.title,
          description: full.description ?? "",
          fileUrl: (full.file as string) ?? (full.file_url as string) ?? (full.attachment as string) ?? "",
        };

        setEditTarget(initial);
        setIsDialogOpen(true);
      } catch (err) {
        console.error(err);
        setEditTarget(row);
        setIsDialogOpen(true);
      }
    })();
  };


  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Latest Updates</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
  <FilterBar onSearch={setSearchQuery} onAdd={() => setIsDialogOpen(true)} onDeleteSelected={deleteSelected} />

  <AddUpdateDialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditTarget(null); }} onSuccess={fetchData} initialData={editTarget} />

        <ConfirmActionDialog
          open={visibilityDialogOpen}
          onOpenChange={setVisibilityDialogOpen}
          title={visibilityTarget && visibilityTarget.value ? "Show this item on the website?" : "Hide this item from the website?"}
          description={visibilityTarget && visibilityTarget.value ? "Make this item visible on the website" : "Users will no longer see it"}
          confirmLabel={visibilityTarget && visibilityTarget.value ? "Show" : "Hide"}
          variant={visibilityTarget && visibilityTarget.value ? "success" : "danger"}
          onConfirm={confirmToggleVisibility}
        />

        <ConfirmActionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Do you want to delete this item?"
          description="This cannot be undone"
          confirmLabel="Delete"
          onConfirm={confirmDelete}
        />

        <DataTable
          columns={getColumns(handleToggleVisibility, handleDelete, handleEdit)}
          data={paginatedData}
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

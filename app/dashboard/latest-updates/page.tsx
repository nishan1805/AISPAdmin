"use client";

import { useEffect, useState } from "react";
import { Update } from "./components/columns";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import AddUpdateDialog from "./components/AddUpdateDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { getColumns } from "./components/columns";
import ConfirmActionDialog from "./components/ConfirmActionDialog";
import { toast } from "sonner";

type ActionType = "delete" | "visibility" | null;

export default function LatestUpdatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Update[]>([]);
  const [totalCount, setTotalCount] =  useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  const [editTarget, setEditTarget] = useState<any | null>(null);
const fetchData = async () => {
  setLoading(true);


  const from = (page - 1) * rowsPerPage;
  const to = from + rowsPerPage - 1;

  const { data: rows, error, count } = await supabase
    .from(Tables.LatestUpdates)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Failed to fetch updates:", error);
    setData([]);
  } else {
    setData(
      (rows || []).map((r: any, idx: number) => ({
        id: String(r.id ?? idx),
        postId:  r.id ?? "",
        title: r.title ?? "",
        createdDate: r.created_at ?? "",
        status: r.status ?? "Posted",
        attachment: r.file_url ?? r.attachment ?? "",
        visibility: !!r.visibility,
        updatedDate: r.updated_at ?? r.created_at ?? "",
      }))
    );
  }

  if (count !== null && count !== undefined) {
    setTotalCount(count);
  }

  setLoading(false);
};
useEffect(() => {
  fetchData();
}, [page, rowsPerPage]);

  const handleRowSelect = (id: string | number, selected: boolean) =>
    setSelectedRows((prev) => (selected ? [...prev, id] : prev.filter((r) => r !== id)));

  const handleSelectAll = (selected: boolean) =>
    setSelectedRows(selected ? paginatedData.map((row) => row.id) : []);


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

  const handleConfirmAction = async () => {
    if (!confirmActionType || !confirmTarget) return;

    try {
      if (confirmActionType === "visibility") {
        const { id, value } = confirmTarget;
        console.log(value , 'value')
        const { error } = await supabase.from(Tables.LatestUpdates).update({ visibility: value ? 0 : 1 , title : "pallavi" }).eq({});
        if (error) throw error;
        toast.success(value ? "Item made visible" : "Item hidden");
      }

      if (confirmActionType === "delete") {
        const { id } = confirmTarget;
        const { error } = await supabase.from(Tables.LatestUpdates).delete().eq("id", id);
        if (error) throw error;
        toast.success("Item deleted successfully");
      }

      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setConfirmDialogOpen(false);
      setConfirmActionType(null);
      setConfirmTarget(null);
    }
  };

  const handleEdit = async (row: Update) => {
    try {
      const { data: full, error } = await supabase
        .from(Tables.LatestUpdates)
        .select("*")
        .eq("id", row.id)
        .single();
      if (error) throw error;

      setEditTarget({
        id: full.id,
        title: full.title,
        description: full.description ?? "",
        fileUrl: full.file ?? full.file_url ?? "",
      });
    } catch (error) {
      console.error(error);
      setEditTarget(row);
    } finally {
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Latest Updates</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar onSearch={setSearchQuery} onAdd={() => setIsDialogOpen(true)} />

        <AddUpdateDialog
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
              ? "Do you want to delete this item?"
              : confirmTarget?.value
              ? "Hide this item from the website?"
              : "Show this item on the website?"
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
          colorClassname={
            confirmActionType === "delete"
              ? "bg-red-500 hover:bg-red-600"
              : confirmTarget?.value
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }
          onConfirm={handleConfirmAction}
        />

        <DataTable
          columns={getColumns(handleToggleVisibility, handleDelete, handleEdit)}
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

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import AddDisclosureDialog from "./components/AddDisclosureDialog";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
import { Disclosure, getColumns } from "./components/columns";

export default function MandatoryDisclosurePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [visibilityTarget, setVisibilityTarget] = useState<{ id: string; value: boolean } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from(Tables.MandatoryDisclosure)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch disclosures:", error);
      toast.error("Failed to fetch disclosures");
      setData([]);
    } else {
      setData(
        (rows || []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          docId: r.doc_id ?? r.id ?? "",
          title: r.title ?? "",
          description: r.description ?? "",
          attachment: r.file_url ?? r.attachment ?? "",
          createdAt: r.created_at ?? "",
          updatedAt: r.updated_at ?? "",
          visibility: !!r.visibility,
          status: r.status ?? "Posted",
        })) as Disclosure[]
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

  // ---------- Visibility Handling ----------
  const handleToggleVisibility = (id: string, value: boolean) => {
    setVisibilityTarget({ id, value });
    setVisibilityDialogOpen(true);
  };

  const confirmToggleVisibility = async () => {
    if (!visibilityTarget) return;
    const { id, value } = visibilityTarget;

    try {
      const { error } = await supabase
        .from(Tables.MandatoryDisclosure)
        .update({ visibility: value })
        .eq("id", id);

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

  // ---------- Delete Handling ----------
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      // First get the file URL to delete from storage
      const { data: record, error: fetchError } = await supabase
        .from(Tables.MandatoryDisclosure)
        .select("file_url")
        .eq("id", deleteTargetId)
        .single();

      if (fetchError) {
        console.error("Failed to fetch record for deletion:", fetchError);
        toast.error("Failed to fetch record for deletion");
        return;
      }

      // Delete the database record
      const { error } = await supabase
        .from(Tables.MandatoryDisclosure)
        .delete()
        .eq("id", deleteTargetId);

      if (error) {
        console.error("Failed to delete disclosure:", error);
        toast.error("Failed to delete disclosure");
        return;
      }

      // Delete file from storage if exists
      if (record?.file_url) {
        try {
          const fileUrl = record.file_url;
          const urlParts = fileUrl.split("/");
          const bucketIndex = urlParts.findIndex((part: string) => part === "AISPPUR");

          if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            const filePath = urlParts.slice(bucketIndex + 1).join("/");
            const decodedPath = decodeURIComponent(filePath);

            const { error: storageError } = await supabase.storage
              .from("AISPPUR")
              .remove([decodedPath]);

            if (storageError) {
              console.warn("Failed to delete file from storage:", storageError);
            }
          }
        } catch (storageErr) {
          console.warn("Could not delete file from storage:", storageErr);
        }
      }

      toast.success("Disclosure deleted");
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete disclosure");
    }
  };

  const deleteSelected = async () => {
    if (!selectedRows.length) {
      toast.error("No rows selected");
      return;
    }

    try {
      const ids = selectedRows.map((id) => String(id));

      // First get all file URLs to delete from storage
      const { data: records, error: fetchError } = await supabase
        .from(Tables.MandatoryDisclosure)
        .select("file_url")
        .in("id", ids);

      if (fetchError) {
        console.error("Failed to fetch records for bulk deletion:", fetchError);
        toast.error("Failed to fetch records for deletion");
        return;
      }

      // Delete the database records
      const { error } = await supabase
        .from(Tables.MandatoryDisclosure)
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Failed to delete selected disclosures:", error);
        toast.error("Failed to delete selected disclosures");
        return;
      }

      // Delete files from storage
      if (records && records.length > 0) {
        const filesToDelete: string[] = [];

        records.forEach((record) => {
          if (record.file_url) {
            try {
              const fileUrl = record.file_url;
              const urlParts = fileUrl.split("/");
              const bucketIndex = urlParts.findIndex((part: string) => part === "AISPPUR");

              if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                const filePath = urlParts.slice(bucketIndex + 1).join("/");
                const decodedPath = decodeURIComponent(filePath);
                filesToDelete.push(decodedPath);
              }
            } catch (e) {
              console.warn("Could not parse file URL:", record.file_url);
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

      toast.success("Selected disclosures deleted");
      setSelectedRows([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected disclosures");
    }
  };

  // ---------- Edit Handling ----------
  const handleEdit = (row: Disclosure) => {
    (async () => {
      try {
        const { data: full, error } = await supabase
          .from(Tables.MandatoryDisclosure)
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
          title: full.title ?? row.title,
          description: full.description ?? "",
          fileUrl: full.file_url ?? row.attachment ?? "",
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

  // ---------- UI ----------
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Mandatory Disclosure
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar
          onSearch={setSearchQuery}
          onAdd={() => setIsDialogOpen(true)}
          onDeleteSelected={deleteSelected}
        />

        <AddDisclosureDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditTarget(null);
          }}
          onSuccess={fetchData}
          initialData={editTarget}
        />

        <ConfirmActionDialog
          open={visibilityDialogOpen}
          onOpenChange={setVisibilityDialogOpen}
          title={
            visibilityTarget?.value
              ? "Show this item on the website?"
              : "Hide this item from the website?"
          }
          description={
            visibilityTarget?.value
              ? "Make this item visible on the website"
              : "Users will no longer see it"
          }
          confirmLabel={visibilityTarget?.value ? "Show" : "Hide"}
          variant={visibilityTarget?.value ? "success" : "danger"}
          onConfirm={confirmToggleVisibility}
        />

        <ConfirmActionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Do you want to delete this item?"
          description="This action cannot be undone"
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

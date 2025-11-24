"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { getGalleryColumns, Photo } from "./components/columns";
import AddGalleryDialog from "./components/AddGalleryDialog";
import GalleryShowcaseModal from "./components/GalleryShowcaseModal";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";

type ActionType = "delete" | "visibility" | null;

export default function PhotoGalleryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Photo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  const [showcaseModalOpen, setShowcaseModalOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<Photo | null>(null);

  // -------------------- Fetch Data --------------------
  const fetchData = async () => {
    setLoading(true);

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    const { data: rows, error, count } = await supabase
      .from(Tables.PhotoGallery)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to fetch galleries:", error);
      toast.error("Failed to fetch galleries");
      setData([]);
    } else {
      setData(
        (rows || []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          galleryId: r.gallery_id ?? r.id ?? "",
          cover: Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : "",
          title: r.title ?? "",
          eventDate: r.event_date ?? "",
          photosCount: Array.isArray(r.images) ? r.images.length : 0,
          status: r.status ?? "Posted",
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
  // -------------------- File Deletion Helper --------------------
  const deleteFileFromStorage = async (fileUrl: string) => {
    if (!fileUrl) return false;
    try {
      console.log("Attempting to delete file:", fileUrl);

      // Try different methods to extract the file path
      let filePath = "";

      if (fileUrl.includes("/storage/v1/object/public/AISPPUR/")) {
        // Standard Supabase storage URL format
        const parts = fileUrl.split("/storage/v1/object/public/AISPPUR/");
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1]); // Decode URL encoding
        }
      } else if (fileUrl.includes("AISPPUR")) {
        // Fallback: extract everything after AISPPUR
        const urlParts = fileUrl.split("/");
        const storageIndex = urlParts.findIndex((part) => part === "AISPPUR");
        if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
          const rawPath = urlParts.slice(storageIndex + 1).join("/");
          filePath = decodeURIComponent(rawPath); // Decode URL encoding
        }
      }

      if (filePath) {
        console.log("Extracted file path for deletion:", filePath);
        const { error } = await supabase.storage.from("AISPPUR").remove([filePath]);
        if (error) {
          console.error("Failed to delete file:", filePath, error);
          return false;
        } else {
          console.log("Successfully deleted file from storage:", filePath);
          return true;
        }
      } else {
        console.warn("Could not extract file path from URL:", fileUrl);
        console.log("URL parts:", fileUrl.split("/"));
        return false;
      }
    } catch (e) {
      console.error("Error deleting file from storage", e);
      return false;
    }
  };

  // -------------------- Batch File Deletion Helper --------------------
  const deleteMultipleFilesFromStorage = async (fileUrls: string[]) => {
    if (!fileUrls || fileUrls.length === 0) return { deleted: 0, total: 0 };

    console.log(`Attempting to delete ${fileUrls.length} files:`, fileUrls);

    // Extract all file paths
    const filePaths: string[] = [];
    for (const fileUrl of fileUrls) {
      if (!fileUrl) continue;

      let filePath = "";
      if (fileUrl.includes("/storage/v1/object/public/AISPPUR/")) {
        const parts = fileUrl.split("/storage/v1/object/public/AISPPUR/");
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1]);
        }
      } else if (fileUrl.includes("AISPPUR")) {
        const urlParts = fileUrl.split("/");
        const storageIndex = urlParts.findIndex((part) => part === "AISPPUR");
        if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
          const rawPath = urlParts.slice(storageIndex + 1).join("/");
          filePath = decodeURIComponent(rawPath);
        }
      }

      if (filePath) {
        filePaths.push(filePath);
      }
    }

    if (filePaths.length > 0) {
      console.log("Extracted file paths for batch deletion:", filePaths);
      try {
        const { error } = await supabase.storage.from("AISPPUR").remove(filePaths);
        if (error) {
          console.error("Failed to delete files in batch:", error);
          // Fallback to individual deletion
          let deletedCount = 0;
          for (const fileUrl of fileUrls) {
            const success = await deleteFileFromStorage(fileUrl);
            if (success) deletedCount++;
          }
          return { deleted: deletedCount, total: fileUrls.length };
        } else {
          console.log("Successfully deleted all files in batch:", filePaths);
          return { deleted: filePaths.length, total: fileUrls.length };
        }
      } catch (e) {
        console.error("Error in batch deletion, falling back to individual:", e);
        // Fallback to individual deletion
        let deletedCount = 0;
        for (const fileUrl of fileUrls) {
          const success = await deleteFileFromStorage(fileUrl);
          if (success) deletedCount++;
        }
        return { deleted: deletedCount, total: fileUrls.length };
      }
    }

    return { deleted: 0, total: fileUrls.length };
  };  // -------------------- Confirm Action --------------------
  const handleConfirmAction = async () => {
    if (!confirmActionType || !confirmTarget) return;

    try {
      if (confirmActionType === "visibility") {
        const { id, value } = confirmTarget;

        const { error } = await supabase
          .from(Tables.PhotoGallery)
          .update({ visibility: !value })
          .eq("id", id);

        if (error) throw error;

        toast.success(!value ? "Gallery made visible" : "Gallery hidden");
      }

      if (confirmActionType === "delete") {
        // If confirmTarget contains multiple ids -> bulk delete
        if (Array.isArray((confirmTarget as any).ids)) {
          const ids: string[] = (confirmTarget as any).ids.map((i: any) => String(i));

          // Fetch records to collect their image URLs
          const { data: records, error: fetchError } = await supabase
            .from(Tables.PhotoGallery)
            .select('id, images')
            .in('id', ids);

          if (fetchError) {
            console.warn('Could not fetch records for deletion', fetchError);
          } else {
            console.log('Found records for bulk deletion:', records);
            console.log('Total records to process:', records?.length || 0);
          }

          if (records) {
            // Collect all image URLs for batch deletion
            const allImageUrls: string[] = [];
            for (const rec of records) {
              console.log(`Processing record ${rec.id} with images:`, rec.images);
              if (Array.isArray(rec.images)) {
                allImageUrls.push(...rec.images);
              }
            }

            if (allImageUrls.length > 0) {
              const result = await deleteMultipleFilesFromStorage(allImageUrls);
              console.log(`Bulk deletion result: ${result.deleted}/${result.total} images deleted`);
            }
          }

          const { error } = await supabase
            .from(Tables.PhotoGallery)
            .delete()
            .in('id', ids);

          if (error) throw error;

          toast.success('Selected galleries deleted');
        } else {
          // Single delete
          const { id } = confirmTarget;

          const { data: record, error: recError } = await supabase
            .from(Tables.PhotoGallery)
            .select('images')
            .eq('id', id)
            .single();

          if (recError) {
            console.warn('Could not fetch record for file deletion:', recError);
          } else {
            console.log('Found record for single deletion:', record);
          }

          if (record?.images && Array.isArray(record.images)) {
            console.log('Deleting images for gallery:', record.images);
            const result = await deleteMultipleFilesFromStorage(record.images);
            console.log(`Single deletion result: ${result.deleted}/${result.total} images deleted`);
          }

          const { error } = await supabase
            .from(Tables.PhotoGallery)
            .delete()
            .eq('id', id);

          if (error) throw error;

          toast.success('Gallery deleted successfully');
        }
      }

      // Refresh data after action
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Action failed');
    } finally {
      setConfirmDialogOpen(false);
      setConfirmActionType(null);
      setConfirmTarget(null);
      setSelectedRows([]);
    }
  };

  // -------------------- Delete Multiple --------------------
  const deleteSelected = async () => {
    if (!selectedRows.length) {
      toast.error("No rows selected");
      return;
    }

    // Open confirm dialog for bulk delete so user can confirm
    setConfirmTarget({ ids: selectedRows.map((i) => String(i)) });
    setConfirmActionType("delete");
    setConfirmDialogOpen(true);
  };

  // -------------------- Edit Handler --------------------
  const handleEdit = async (row: Photo) => {
    try {
      const { data: full, error } = await supabase
        .from(Tables.PhotoGallery)
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
        eventDate: full.event_date ?? row.eventDate,
        images: full.images ?? [],
      };

      setEditTarget(initial);
      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
      setEditTarget(row);
      setIsDialogOpen(true);
    }
  };

  // -------------------- View Gallery Handler --------------------
  const handleViewGallery = async (row: Photo) => {
    try {
      const { data: full, error } = await supabase
        .from(Tables.PhotoGallery)
        .select("*")
        .eq("id", row.id)
        .single();

      if (error) {
        console.error("Failed to fetch gallery for viewing:", error);
        toast.error("Failed to load gallery");
        return;
      }

      const galleryData = {
        ...row,
        images: full.images ?? [],
        title: full.title ?? row.title,
        description: full.description ?? "",
        eventDate: full.event_date ?? row.eventDate,
      };

      setSelectedGallery(galleryData);
      setShowcaseModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load gallery");
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
        <h1 className="text-3xl font-bold text-slate-800">Photo Gallery</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar
          onSearch={setSearchQuery}
          onAdd={() => setIsDialogOpen(true)}
          onDeleteSelected={deleteSelected}
        />

        <AddGalleryDialog
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
              ? "Do you want to delete this gallery?"
              : confirmTarget?.value
                ? "Hide this gallery from the website?"
                : "Show this gallery on the website?"
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

        <GalleryShowcaseModal
          open={showcaseModalOpen}
          onOpenChange={setShowcaseModalOpen}
          gallery={selectedGallery}
          onSuccess={fetchData}
          tableName={Tables.PhotoGallery}
        />

        <DataTable
          columns={getGalleryColumns(handleToggleVisibility, handleDelete, handleEdit, handleViewGallery)}
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

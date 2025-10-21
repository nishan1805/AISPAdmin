"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { columns, Photo } from "./components/columns";
import AddGalleryDialog from "./components/AddGalleryDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";

export default function PhotoGalleryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(Tables.PhotoGallery).select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch galleries:", error);
      setData([]);
    } else {
      setData((rows || []).map((r: any, idx: number) => ({
        id: String(r.id ?? idx),
        galleryId: r.gallery_id ?? r.id ?? "",
        cover: Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : "",
        title: r.title ?? "",
        eventDate: r.event_date ?? "",
        photosCount: Array.isArray(r.images) ? r.images.length : 0,
        status: r.status ?? "Posted",
        visibility: !!r.visibility,
      })) as Photo[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalCount = filteredData.length;
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleRowSelect = (id: string | number, selected: boolean) => {
    setSelectedRows((prev) => (selected ? [...prev, id] : prev.filter((r) => r !== id)));
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? paginatedData.map((row) => row.id) : []);
  };

  const deleteSelected = async () => {
    if (!selectedRows || selectedRows.length === 0) {
      // optional: show a toast or similar
      return;
    }

    try {
      const ids = selectedRows.map((id) => (typeof id === "string" ? id : String(id)));
      const { error } = await supabase.from(Tables.PhotoGallery).delete().in("id", ids);
      if (error) {
        console.error("Failed to delete selected gallery items:", error);
        return;
      }

      setSelectedRows([]);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Photo Gallery</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
  <FilterBar onSearch={setSearchQuery} onAdd={() => setIsDialogOpen(true)} onDeleteSelected={deleteSelected} />

        <AddGalleryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} />

        <DataTable
          columns={columns}
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

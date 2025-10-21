"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { columns, NewsItem } from "./components/columns";
import AddNewsMediaDialog from "./components/AddNewsMediaDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";

export default function NewsMediaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(Tables.NewsMedia).select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch news media:", error);
      setData([]);
    } else {
      setData((rows || []).map((r: any, idx: number) => ({
        id: String(r.id ?? idx),
        postId: r.post_id ?? r.id ?? "",
        cover: Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : "",
        title: r.title ?? "",
        eventDate: r.event_date ?? "",
        source: r.source ?? "",
        status: r.status ?? "Posted",
        visibility: !!r.visibility,
      })) as NewsItem[]);
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
    if (!selectedRows || selectedRows.length === 0) return;

    try {
      const ids = selectedRows.map((id) => (typeof id === "string" ? id : String(id)));
      const { error } = await supabase.from(Tables.NewsMedia).delete().in("id", ids);
      if (error) {
        console.error("Failed to delete selected news/media:", error);
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
        <h1 className="text-3xl font-bold text-slate-800">News & Media</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
  <FilterBar onSearch={setSearchQuery} onAdd={() => setIsDialogOpen(true)} onDeleteSelected={deleteSelected} />

        <AddNewsMediaDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} />

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

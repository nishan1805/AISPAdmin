"use client";

import { useEffect, useState } from "react";
import { columns, Update } from "./components/columns";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import AddUpdateDialog from "./components/AddUpdateDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";

export default function LatestUpdatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Update[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      // Map DB rows to Update type expected by table (add id if missing)
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Latest Updates</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar onSearch={setSearchQuery} onAdd={() => setIsDialogOpen(true)} />

        <AddUpdateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} />

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

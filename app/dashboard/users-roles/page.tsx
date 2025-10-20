"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { columns, UserRole } from "./components/columns";
import AddUserDialog from "./components/AddUserDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";

export default function UsersRolesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(Tables.UsersRoles).select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch users:", error);
      setData([]);
    } else {
      setData((rows || []).map((r: any, idx: number) => ({
        id: String(r.id ?? idx),
        userId: r.user_id ?? r.id ?? "",
        name: r.name ?? "",
        role: r.role ?? "",
        department: r.department ?? "",
        accessLevel: r.access_level ?? "",
        status: r.status ?? "Active",
      })) as UserRole[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalCount = filteredData.length;
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleRowSelect = (id: string | number, selected: boolean) => {
    setSelectedRows((prev) => (selected ? [...prev, id] : prev.filter((r) => r !== id)));
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? paginatedData.map((row) => row.id) : []);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Users & Roles</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar onSearch={setSearchQuery} onAdd={() => setIsDialogOpen(true)} />

        <AddUserDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} />

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


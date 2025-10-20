"use client";

import { useState } from "react";
import { columns, Update } from "./components/columns";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";

const mockData: Update[] = [
  {
    id: "1",
    postId: "00596",
    title: "Class XI Admission Form 2025-26",
    createdDate: "11/02/25 04:44 PM",
    status: "New",
    attachment: "PDF",
    visibility: true,
    updatedDate: "11/02/25 04:44 PM",
  },
  {
    id: "2",
    postId: "00597",
    title: "XI Admission Form 2025-26 (Updated)",
    createdDate: "12/02/25 09:12 AM",
    status: "Posted",
    attachment: "PDF",
    visibility: true,
    updatedDate: "12/02/25 09:12 AM",
  },
  {
    id: "3",
    postId: "00598",
    title: "Class XI Admission Form 2025-26",
    createdDate: "13/02/25 10:15 AM",
    status: "Deleted",
    attachment: "PDF",
    visibility: false,
    updatedDate: "13/02/25 10:15 AM",
  },
];

export default function LatestUpdatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const filteredData = mockData.filter((item) =>
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
        <FilterBar onSearch={setSearchQuery} />

        <DataTable
          columns={columns}
          data={paginatedData}
          totalRecords={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
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

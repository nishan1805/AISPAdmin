"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { columns, Photo } from "./components/columns";

const mockData: Photo[] = [
  {
    id: "1",
    galleryId: "00596",
    cover: "img1.jpg",
    title: "Annual Day 2025",
    eventDate: "12 Jun 2025",
    photosCount: 10,
    status: "New",
    visibility: true,
  },
  {
    id: "2",
    galleryId: "00597",
    cover: "img2.jpg",
    title: "Independence Day Celebrations",
    eventDate: "12 Jun 2025",
    photosCount: 10,
    status: "Deleted",
    visibility: false,
  },
  {
    id: "3",
    galleryId: "00598",
    cover: "img3.jpg",
    title: "Republic Day Celebrations",
    eventDate: "12 Jun 2025",
    photosCount: 20,
    status: "Posted",
    visibility: true,
  },
];

export default function PhotoGalleryPage() {
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
        <h1 className="text-3xl font-bold text-slate-800">Photo Gallery</h1>
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

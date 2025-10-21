"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalRecords: number;
  page: number;
  rowsPerPage: number;
  isLoading?: boolean;
  selectedRows: (string | number)[];
  onRowSelect: (id: string | number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  pageOptions?: number[];
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  totalRecords,
  page,
  rowsPerPage,
  isLoading = false,
  selectedRows,
  onRowSelect,
  onSelectAll,
  onPageChange,
  onRowsPerPageChange,
  pageOptions = [5, 10, 20, 50, 100],
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const allSelected = data.length > 0 && data.every((row) => selectedRows.includes(row.id));

  return (
    <>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full w-max">
          <TableHeader className="bg-blue-50">
            <TableRow>
              {columns.map((col) =>
                col.key === "select" ? (
                  <TableHead key="select" className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(value) => onSelectAll(!!value)}
                    />
                  </TableHead>
                ) : (
                  <TableHead key={col.key as string}>{col.label}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              [...Array(rowsPerPage)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, idx) => (
                    <TableCell key={idx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.length > 0 ? (
              data.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={`cursor-pointer hover:bg-blue-50 ${
                    selectedRows.includes(row.id) ? "bg-blue-50" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key as string}>
                      {col.key === "select" ? (
                        <Checkbox
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={(value) =>
                            onRowSelect(row.id, !!value)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : col.render ? (
                        col.render(row, index)
                      ) : (
                        (row[col.key as keyof T] as React.ReactNode)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap justify-between items-center mt-4 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm">Total: {totalRecords}</span>
          <div className="flex items-center gap-2">
            <Select
              value={String(rowsPerPage)}
              onValueChange={(value) => onRowsPerPageChange(Number(value))}
              disabled={totalRecords === 0}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {pageOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm">rows per page</span>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Select
            value={String(page)}
            onValueChange={(value) => onPageChange(Number(value))}
            disabled={totalPages === 0}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Page" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPages }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm">of {totalPages}</span>

          <Button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            size="icon"
            variant="outline"
          >
            <ChevronLeft />
          </Button>

          <Button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            size="icon"
            variant="outline"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </>
  );
}

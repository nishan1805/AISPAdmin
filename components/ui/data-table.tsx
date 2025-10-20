import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";


interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageOptions?: number[];
}

export function DataTable<T extends { id?: string | number }>({
  title,
  columns,
  data,
  totalRecords,
  currentPage,
  pageSize,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  pageOptions = [5, 10, 20, 50, 100],
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full w-max">
            <TableHeader className="bg-blue-50">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key as string} className={col.className}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(pageSize)].map((_, i) => (
                  <TableRow key={i}>
                    {columns?.map((_, idx) => (
                      <TableCell key={idx}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.length > 0 ? (
                data.map((row, index) => (
                  <TableRow key={row.id || index}>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key as string}
                        className={col.className}
                      >
                        {col.render
                          ? col.render(row, index)
                          : (row[col.key as keyof T] as React.ReactNode)}
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
          <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Total:</span>
            <span className="text-sm">{totalRecords}</span>
          </div>
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={totalRecords === 0}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {pageOptions?.map((size: number) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm">items per page</span>
          </div>
          </div>

          {/* Page Info + Navigation */}
          <div className="flex items-center gap-2">
            <Select
              value={String(currentPage)}
              onValueChange={(value) => onPageChange(Number(value))}
              disabled={totalPages === 0}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Page" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <SelectItem key={page} value={String(page)}>
                      {page}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <span className="text-sm">of {totalPages} pages</span>

            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalPages === 0}
              size="icon"
              variant="outline"
              className="hover:bg-primary hover:text-white transition-colors duration-300 ease-in-out"
            >
              <ChevronLeft />
            </Button>

            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              size="icon"
              variant="outline"
              className="hover:bg-primary hover:text-white transition-colors duration-300 ease-in-out"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
    </>
  );
}

export default DataTable;
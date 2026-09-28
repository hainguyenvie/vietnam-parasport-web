"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, LayoutPanelLeft } from "lucide-react";
import { TablePagination } from "./TablePagination";
import { TableToolbar } from "./TableToolbar";
import { FloatingActionBar } from "./FloatingActionBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Checkbox } from "@/components/ui/Checkbox";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ColumnDef<T> {
  key: string;
  title: string;
  sortable?: boolean;
  hidden?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  totalRecords: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (key: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterNodes?: React.ReactNode;
  onCreate?: () => void;
  createLabel?: string;
  onExport?: () => void;
  exportNode?: React.ReactNode;
  onRowClick?: (e: React.MouseEvent, row: T) => void;
  selectable?: boolean;
  getRowId?: (row: T) => string;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  totalRecords,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortKey,
  sortDirection,
  onSort,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterNodes,
  onCreate,
  createLabel,
  onExport,
  exportNode,
  selectable,
  getRowId,
  bulkActions,
  isLoading,
  onRowClick
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  useEffect(() => {
    const initialHidden = new Set<string>();
    columns.forEach(col => {
      if (col.hidden) initialHidden.add(col.key);
    });
    setHiddenColumns(initialHidden);
  }, [columns]);

  const toggleColumnVisibility = (key: string) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(key)) newHidden.delete(key);
    else newHidden.add(key);
    setHiddenColumns(newHidden);
  };

  const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));

  const allRowIds = data.map(row => getRowId ? getRowId(row) : (row as any).id);
  const isAllSelected = data.length > 0 && allRowIds.every(id => selectedIds.has(id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else {
      const newSelected = new Set<string>();
      allRowIds.forEach(id => newSelected.add(id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const columnVisibilityNode = (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
        title="Hiển thị cột"
      >
        <LayoutPanelLeft size={18} />
      </Button>
      {isColumnDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-xl border z-50 overflow-hidden">
          <div className="px-4 py-2 border-b text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Hiển thị cột
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {columns.map(col => (
              <label key={col.key} className="flex items-center gap-3 px-2 py-1.5 hover:bg-accent rounded-lg cursor-pointer transition">
                <Checkbox
                  checked={!hiddenColumns.has(col.key)}
                  onCheckedChange={() => toggleColumnVisibility(col.key)}
                />
                <span className="text-sm font-medium">{col.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative bg-card rounded-2xl flex flex-col h-full w-full">
      <TableToolbar
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        filterNodes={filterNodes}
        onCreate={onCreate}
        createLabel={createLabel}
        onExport={onExport}
        exportNode={exportNode}
        columnVisibilityNode={columnVisibilityNode}
      />

      <div className="overflow-x-auto w-full">
        <Table role="table" aria-label={searchPlaceholder || "Bảng dữ liệu"}>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={isAllSelected}
                    data-indeterminate={isSomeSelected ? "true" : undefined}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-16 text-center">STT</TableHead>
              {visibleColumns.map((col, idx) => {
                const isLast = idx === visibleColumns.length - 1;
                return (
                  <TableHead
                    key={col.key}
                    className={`transition-colors ${col.sortable ? 'cursor-pointer hover:bg-accent' : ''} ${isLast ? 'sticky right-0 z-10 bg-card shadow-[-4px_0_10px_rgba(0,0,0,0.02)]' : ''}`}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                    aria-sort={col.sortable && sortKey === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : col.sortable ? 'none' : undefined}
                  >
                    <div className={`flex items-center gap-2 ${isLast ? 'justify-end' : ''}`}>
                      <span>{col.title}</span>
                      {col.sortable && (
                        <span className="text-muted-foreground">
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize || 10 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {selectable && <TableCell><Skeleton className="w-4 h-4" /></TableCell>}
                  <TableCell><Skeleton className="w-6 h-4 mx-auto" /></TableCell>
                  {visibleColumns.map((col, colIdx) => (
                    <TableCell key={`skeleton-col-${colIdx}`}>
                      <Skeleton className={`h-4 ${colIdx === 0 ? 'w-3/4' : 'w-1/2'}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (selectable ? 2 : 1)} className="p-8">
                  <EmptyState title="Không tìm thấy dữ liệu" description="Thay đổi bộ lọc hoặc tạo mới bản ghi." />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = getRowId ? getRowId(row) : (row as any).id;
                const isSelected = selectedIds.has(rowId);
                const stt = (page - 1) * pageSize + rowIndex + 1;

                return (
                  <TableRow
                    key={`row-${rowIndex}`}
                    className={`group transition-colors ${isSelected ? 'bg-accent' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={(e) => onRowClick && onRowClick(e, row)}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    {selectable && (
                      <TableCell className="text-center">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectRow(rowId)} />
                      </TableCell>
                    )}
                    <TableCell className="text-center text-sm font-medium text-muted-foreground">
                      {stt}
                    </TableCell>
                    {visibleColumns.map((col, idx) => {
                      const isLast = idx === visibleColumns.length - 1;
                      return (
                        <TableCell
                          key={col.key}
                          className={`text-sm ${isLast ? `sticky right-0 z-10 ${isSelected ? 'bg-accent' : 'bg-card'} shadow-[-4px_0_10px_rgba(0,0,0,0.02)]` : ''}`}
                        >
                          {col.render ? col.render(row, rowIndex) : (row as any)[col.key]}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      {selectable && bulkActions && (
        <FloatingActionBar
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          actions={bulkActions(Array.from(selectedIds), clearSelection)}
        />
      )}
    </div>
  );
}

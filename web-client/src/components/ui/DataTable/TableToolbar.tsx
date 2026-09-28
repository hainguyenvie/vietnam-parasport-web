import React, { useState, useEffect } from "react";
import { Search, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDebounce } from "@/hooks/useDebounce";

interface TableToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterNodes?: React.ReactNode;
  onCreate?: () => void;
  createLabel?: string;
  onExport?: () => void;
  exportNode?: React.ReactNode;
  columnVisibilityNode?: React.ReactNode;
}

export function TableToolbar({
  searchPlaceholder = "Tìm kiếm...",
  searchValue = "",
  onSearchChange,
  filterNodes,
  onCreate,
  createLabel = "Tạo mới",
  onExport,
  exportNode,
  columnVisibilityNode
}: TableToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedSearch = useDebounce(localSearch, 500);

  useEffect(() => {
    if (onSearchChange && debouncedSearch !== searchValue) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-border bg-background rounded-t-2xl">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {onSearchChange && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {filterNodes && (
          <div className="flex items-center gap-2">
            {filterNodes}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {columnVisibilityNode}
        {exportNode ? exportNode : onExport && (
          <Button variant="outline" size="icon" onClick={onExport} title="Xuất dữ liệu">
            <Download size={18} />
          </Button>
        )}
        {onCreate && (
          <Button variant="default" onClick={onCreate}>
            <Plus size={18} />
            <span>{createLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

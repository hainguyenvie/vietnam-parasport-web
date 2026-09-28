import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  page,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const [inputValue, setInputValue] = useState(page.toString());

  useEffect(() => {
    setInputValue(page.toString());
  }, [page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      let adjustedStart = start;
      let adjustedEnd = end;
      if (page <= 4) adjustedEnd = 5;
      else if (page >= totalPages - 3) adjustedStart = totalPages - 4;
      for (let i = adjustedStart; i <= adjustedEnd; i++) {
        if (i > 1 && i < totalPages) pages.push(i);
      }
      if (page < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-background rounded-b-2xl">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <Select value={String(pageSize)} onValueChange={(v: string) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>dòng / trang</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Hiển thị {totalRecords === 0 ? 0 : startRecord}-{endRecord} trên tổng số {totalRecords}
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => handlePageChange(page - 1)} disabled={page === 1} title="Trang trước">
            <ChevronLeft size={16} />
          </Button>
          {getPages().map((item, index) => {
            if (item === "...") {
              return <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground select-none text-sm font-medium">...</span>;
            }
            return (
              <Button
                key={`page-${item}`}
                variant={item === page ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(Number(item))}
                className="w-8 h-8"
              >
                {item}
              </Button>
            );
          })}
          <Button variant="outline" size="icon" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} title="Trang sau">
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground border-l border-border pl-4 h-6">
          <span>Đi đến</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { const val = Number(inputValue); if (val >= 1 && val <= totalPages) handlePageChange(val); else setInputValue(page.toString()); } }}
            onBlur={() => { const val = Number(inputValue); if (val >= 1 && val <= totalPages) handlePageChange(val); else setInputValue(page.toString()); }}
            className="w-12 h-8 text-center rounded-md border border-input bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span>trang</span>
        </div>
      </div>
    </div>
  );
}

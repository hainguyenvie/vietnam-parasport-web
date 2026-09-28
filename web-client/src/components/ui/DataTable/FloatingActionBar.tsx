import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";

interface FloatingActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: React.ReactNode;
}

export function FloatingActionBar({
  selectedCount,
  onClearSelection,
  actions
}: FloatingActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs font-bold">
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium">đã chọn</span>
        </div>
        <div className="w-px h-6 bg-primary-foreground/20" />
        <div className="flex items-center gap-2">
          {actions}
        </div>
        <div className="w-px h-6 bg-primary-foreground/20" />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClearSelection}
          className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
          title="Bỏ chọn tất cả"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}

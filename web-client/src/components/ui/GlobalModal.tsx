"use client";

import React from 'react';
import { useModalStore } from '@/store/useModalStore';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function GlobalModal() {
  const { isOpen, title, description, onConfirm, onCancel, confirmText, cancelText, type, customContent, closeModal } = useModalStore();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (onCancel) onCancel();
      closeModal();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-2">
          {type === 'custom' && customContent && <div>{customContent}</div>}
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="secondary" onClick={handleCancel}>
            {cancelText || "Hủy"}
          </Button>
          <Button variant="default" onClick={handleConfirm}>
            {confirmText || "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { create } from 'zustand';
import React from 'react';

type ModalType = 'confirm' | 'prompt' | 'custom' | null;

interface ModalState {
  type: ModalType;
  isOpen: boolean;
  title: string;
  description: string;
  customContent?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  openModal: (options: Omit<ModalState, 'isOpen' | 'openModal' | 'closeModal'>) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  type: null,
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  openModal: (options) => set({ ...options, isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));

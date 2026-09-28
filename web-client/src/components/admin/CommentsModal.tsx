"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Loader2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { useSession } from "next-auth/react";

// next/image available for migration — add unoptimized for dynamic URLs

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityTitle: string;
  apiEndpoint: string;
}

export function CommentsModal({ isOpen, onClose, entityId, entityTitle, apiEndpoint }: CommentsModalProps) {
  const { data: session } = useSession();
  const token = (session as any)  ?.accessToken;
  
  // Note: Adjust the API endpoint according to the actual backend route for comments by post
  const { data: comments = [], isLoading, mutate } = useApi(
    isOpen && entityId ? apiEndpoint : null
  );

  const [processing, setProcessing] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    setProcessing(commentId);
    try {
      const res = await apiClient.request(`/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Đã xóa bình luận");
        mutate();
      } else {
        toast.error("Xóa bình luận thất bại");
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async (commentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'HIDDEN' : 'APPROVED';
    setProcessing(commentId);
    try {
      const res = await apiClient.request(`/comments/${commentId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(newStatus === 'APPROVED' ? "Đã duyệt bình luận" : "Đã ẩn bình luận");
        mutate();
      } else {
        toast.error("Cập nhật trạng thái thất bại");
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quản lý bình luận - {entityTitle}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Chưa có bình luận nào cho bài viết này.</div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {comments.map((comment: any  ) => {
                const isApproved = comment.isApproved !== false;
                const status = isApproved ? 'APPROVED' : 'HIDDEN';
                const authorName = comment.authorName || comment.user?.fullName || comment.user?.name || '?';

                return (
                  <div key={comment.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex items-start gap-4">
                    {comment.user?.avatarUrl ? (
                      <img loading="lazy" 
                        src={comment.user.avatarUrl} 
                        alt={authorName} 
                        className="w-10 h-10 rounded-full object-cover shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          {authorName[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{authorName}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(comment.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">
                        {comment.content}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button 
                          variant={status === 'APPROVED' ? 'outline' : 'default'} 
                          size="sm" 
                          onClick={() => handleApprove(comment.id, status)}
                          disabled={processing === comment.id}
                          className="text-xs"
                        >
                          {processing === comment.id ? <Loader2 size={14} className="animate-spin" /> : 
                            status === 'APPROVED' ? <XCircle size={14} className="mr-1" /> : <CheckCircle size={14} className="mr-1" />
                          }
                          {status === 'APPROVED' ? 'Ẩn bình luận' : 'Duyệt hiển thị'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(comment.id)}
                          disabled={processing === comment.id}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                        >
                          {processing === comment.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} className="mr-1" />}
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useModalStore } from "@/store/useModalStore";
import { Loader2, Smile, Image as ImageIcon, X, ThumbsUp, Heart, Send } from "lucide-react";
import SecureImage from "./SecureImage";
import Lightbox from "./Lightbox";
import { getSignedUrl } from "@/utils/security";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author?: { id: string; fullName: string; avatarUrl?: string };
  user?: { id: string; fullName: string; avatarUrl?: string };
  replies?: CommentItem[] | undefined;
  reactions?: any;
  _count?: { replies: number; reactions: number };
}

// Standard Facebook reactions config
const REACTION_TYPES = [
  { key: "LIKE", label: "Thích", icon: "👍", color: "text-blue-600 font-bold" },
  { key: "LOVE", label: "Yêu thích", icon: "❤️", color: "text-red-500 font-bold" },
  { key: "HAHA", label: "Haha", icon: "😂", color: "text-yellow-500 font-bold" },
  { key: "WOW", label: "Wow", icon: "😮", color: "text-yellow-500 font-bold" },
  { key: "SAD", label: "Buồn", icon: "😢", color: "text-yellow-600 font-bold" },
  { key: "ANGRY", label: "Phẫn nộ", icon: "😡", color: "text-orange-600 font-bold" }
];

const POPULAR_EMOJIS = ["😀", "😂", "🥰", "👍", "❤️", "😮", "😢", "🔥", "🎉", "👏"];

export default function PostInteractions({ postId, matchId }: { postId?: string; matchId?: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Reply states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const LIMIT = 5;

  // Edit comment states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Rich attachment states (Arrays for multiple images)
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
  const [replyImages, setReplyImages] = useState<File[]>([]);
  const [replyImagePreviews, setReplyImagePreviews] = useState<string[]>([]);

  // Popover menus state
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [showMainEmoji, setShowMainEmoji] = useState(false);
  const [showReplyEmoji, setShowReplyEmoji] = useState(false);
  const hoverTimeout = useRef<any>(null);

  // Lightbox preview state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (imagesList: string[], startIndex: number) => {
    const signedUrls = imagesList.map(img => getSignedUrl(img));
    setLightboxImages(signedUrls);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  useEffect(() => {
    setPage(1);
    fetchComments(1);
    if (session && postId) {
      checkBookmark();
    }
  }, [postId, matchId, session]);

  const fetchComments = async (pageNum = 1) => {
    try {
      const queryParam = postId ? `postId=${postId}` : `matchId=${matchId}`;
      const res = await apiClient.request(`/comments?${queryParam}&page=${pageNum}&limit=${LIMIT}`);
      const data = await res.json();
      
      if (pageNum === 1) {
        setComments(data);
      } else {
        setComments(prev => [...prev, ...data]);
      }
      
      if (data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const checkBookmark = async () => {
    try {
      const res = await apiClient.request(`/bookmarks/check/${postId}`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleBookmark = async () => {
    if (!session) {
      toast.warning("Vui lòng đăng nhập để lưu bài viết.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.request(`/bookmarks/toggle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ postId })
      });
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Image Upload helper
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiClient.request("/media/upload?isPublic=true", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.error("Upload error", e);
    }
    return null;
  };

  const handlePostComment = async () => {
    if (!session) {
      toast.warning("Vui lòng đăng nhập để bình luận.");
      return;
    }
    if (!newComment.trim() && commentImages.length === 0) return;

    try {
      setLoading(true);
      
      // Upload all selected images in parallel
      let uploadedUrls: string[] = [];
      if (commentImages.length > 0) {
        const urls = await Promise.all(commentImages.map(img => uploadFile(img)));
        uploadedUrls = urls.filter((url): url is string => url !== null);
      }

      const res = await apiClient.request(`/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ 
          postId, 
          matchId, 
          content: newComment,
          imageAttachments: uploadedUrls
        })
      });
      if (res.ok) {
        setNewComment("");
        setCommentImages([]);
        setCommentImagePreviews([]);
        setShowMainEmoji(false);
        setPage(1);
        fetchComments(1);
        toast.success("Đã gửi bình luận.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!session) {
      toast.warning("Vui lòng đăng nhập để phản hồi.");
      return;
    }
    if (!replyContent.trim() && replyImages.length === 0) return;

    try {
      setLoading(true);
      
      // Upload all selected reply images in parallel
      let uploadedUrls: string[] = [];
      if (replyImages.length > 0) {
        const urls = await Promise.all(replyImages.map(img => uploadFile(img)));
        uploadedUrls = urls.filter((url): url is string => url !== null);
      }

      const res = await apiClient.request(`/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ 
          postId, 
          matchId, 
          content: replyContent, 
          parentId,
          imageAttachments: uploadedUrls
        })
      });
      if (res.ok) {
        setReplyContent("");
        setReplyImages([]);
        setReplyImagePreviews([]);
        setReplyingToId(null);
        setShowReplyEmoji(false);
        setPage(1);
        fetchComments(1);
        toast.success("Đã gửi phản hồi.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingContent.trim()) return;
    try {
      setLoading(true);
      const res = await apiClient.request(`/comments/${commentId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ content: editingContent })
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditingContent("");
        setPage(1);
        fetchComments(1);
        toast.success("Đã cập nhật bình luận.");
      } else {
        toast.error("Chỉnh sửa thất bại.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (commentId: string, reactionType: string | null) => {
    if (!session) {
      toast.warning("Vui lòng đăng nhập để bày tỏ cảm xúc.");
      return;
    }
    try {
      const res = await apiClient.request(`/comments/${commentId}/react`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ type: reactionType })
      });
      if (res.ok) {
        // Optimistically update local comments state
        const userId = (session?.user as any)?.id;
        setComments(prevComments => {
          return prevComments.map(comment => {
            if (comment.id === commentId) {
              const updatedReactions = { ...(comment.reactions || {}) };
              if (reactionType) {
                updatedReactions[userId] = reactionType;
              } else {
                delete updatedReactions[userId];
              }
              return { ...comment, reactions: updatedReactions };
            }
            if (comment.replies && comment.replies.length > 0) {
              const updatedReplies = comment.replies.map((reply: any) => {
                if (reply.id === commentId) {
                  const updatedReactions = { ...(reply.reactions || {}) };
                  if (reactionType) {
                    updatedReactions[userId] = reactionType;
                  } else {
                    delete updatedReactions[userId];
                  }
                  return { ...reply, reactions: updatedReactions };
                }
                return reply;
              });
              return { ...comment, replies: updatedReplies };
            }
            return comment;
          });
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (id: string) => {
    useModalStore.getState().openModal({
      type: "confirm",
      title: "Xác nhận xóa",
      description: "Bạn có chắc chắn muốn xóa bình luận này?",
      onConfirm: async () => {
        try {
          const res = await apiClient.request(`/comments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
          });
          if (res.ok) {
            toast.success("Đã xóa bình luận.");
            setPage(1);
            fetchComments(1);
          } else {
            toast.error("Không thể xóa bình luận.");
          }
        } catch (error) {
          console.error(error);
          toast.error("Lỗi kết nối.");
        }
      }
    });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage);
  };

  // Keyboard shortcut Enter (without shift) to post
  const handleKeyDown = (e: React.KeyboardEvent, submitFn: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitFn();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      const newPreviews = files.map(file => URL.createObjectURL(file));
      if (isReply) {
        setReplyImages(prev => [...prev, ...files]);
        setReplyImagePreviews(prev => [...prev, ...newPreviews]);
      } else {
        setCommentImages(prev => [...prev, ...files]);
        setCommentImagePreviews(prev => [...prev, ...newPreviews]);
      }
    }
    // Reset target value to allow selecting same file next time
    e.target.value = "";
  };

  const handleRemovePreviewImage = (index: number, isReply: boolean) => {
    if (isReply) {
      setReplyImages(prev => prev.filter((_, i) => i !== index));
      setReplyImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      setCommentImages(prev => prev.filter((_, i) => i !== index));
      setCommentImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getReactionSummary = (reactions: any) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    const counts: any = {};
    Object.values(reactions).forEach((type: any) => {
      counts[type] = (counts[type] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]);
    const total = Object.values(counts).reduce((acc: number, cur: any) => acc + cur, 0) as number;
    return {
      types: sorted.slice(0, 3).map((x) => x[0]), // top 3 reactions
      total
    };
  };

  const handleShowHistory = (history: any[]) => {
    useModalStore.getState().openModal({
      type: "custom",
      title: "Lịch sử chỉnh sửa",
      description: "",
      customContent: (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 my-4">
          {[...history].reverse().map((item: any, i: number) => (
            <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
              <div className="text-[11px] text-slate-400 font-semibold mb-1">
                {new Date(item.editedAt).toLocaleString("vi-VN")}
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 break-words whitespace-pre-wrap">
                {item.content}
              </div>
            </div>
          ))}
        </div>
      ),
      confirmText: "Đóng",
      onConfirm: () => useModalStore.getState().closeModal()
    });
  };

  const renderImageGrid = (attachments: any) => {
    let urls: string[] = [];
    try {
      if (Array.isArray(attachments)) {
        urls = attachments;
      } else if (typeof attachments === 'string') {
        urls = JSON.parse(attachments);
      }
    } catch (e) {
      console.error(e);
    }

    if (!urls || urls.length === 0) return null;
    
    // Map raw file paths to secure Signed URLs
    const signedUrls = urls.map(url => getSignedUrl(url));
    const count = signedUrls.length;

    if (count === 1) {
      return (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 max-w-[280px]">
          <SecureImage 
            src={signedUrls[0]} 
            alt="Đính kèm" 
            className="w-full h-auto max-h-[220px] object-cover cursor-pointer hover:opacity-95 transition"
            onClick={() => openLightbox(urls, 0)}
          />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="mt-2 grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 max-w-[320px]">
          {signedUrls.map((url, i) => (
            <SecureImage 
              key={i}
              src={url} 
              alt="Đính kèm" 
              className="w-full h-28 object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => openLightbox(urls, i)}
            />
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 max-w-[340px]">
          <div className="col-span-2">
            <SecureImage 
              src={signedUrls[0]} 
              alt="Đính kèm" 
              className="w-full h-36 object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => openLightbox(urls, 0)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <SecureImage 
              src={signedUrls[1]} 
              alt="Đính kèm" 
              className="w-full h-[70px] object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => openLightbox(urls, 1)}
            />
            <SecureImage 
              src={signedUrls[2]} 
              alt="Đính kèm" 
              className="w-full h-[70px] object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => openLightbox(urls, 2)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 max-w-[340px]">
        {signedUrls.slice(0, 4).map((url, i) => {
          const isLast = i === 3;
          const hasMore = count > 4;
          return (
            <div key={i} className="relative">
              <SecureImage 
                src={url} 
                alt="Đính kèm" 
                className="w-full h-24 object-cover cursor-pointer hover:opacity-95 transition"
                onClick={() => openLightbox(urls, i)}
              />
              {isLast && hasMore && (
                <div 
                  onClick={() => openLightbox(urls, 3)}
                  className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-base font-bold cursor-pointer hover:bg-black/65 transition"
                >
                  +{count - 3}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };


  const renderCommentBubble = (comment: any, isReply = false) => {
    const currentUserId = (session?.user as any)?.id;
    const userReactionKey = comment.reactions?.[currentUserId] || null;
    const activeReaction = REACTION_TYPES.find(r => r.key === userReactionKey);
    const reactionSummary = getReactionSummary(comment.reactions);

    if (editingCommentId === comment.id) {
      return (
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 relative flex flex-col shadow-sm">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, () => handleEditComment(comment.id))}
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-slate-800 dark:text-slate-200 focus:ring-0"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <button
                onClick={() => {
                  setEditingCommentId(null);
                  setEditingContent("");
                }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold px-2 py-1 rounded"
              >
                Hủy
              </button>
              <button
                onClick={() => handleEditComment(comment.id)}
                disabled={loading || !editingContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0">
        <div className="inline-block bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-2xl rounded-tl-none relative max-w-full">
          <h4 className="font-bold text-xs text-slate-900 dark:text-white hover:underline cursor-pointer mb-0.5">
            {comment.user?.fullName}
          </h4>
          <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">{comment.content}</p>
          
          {renderImageGrid(comment.imageAttachments)}

          {/* Reaction icons count badge */}
          {reactionSummary && (
            <div className="absolute -bottom-2 right-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm text-[10px] font-semibold text-slate-500 dark:text-slate-300 z-10 select-none">
              <span className="flex">
                {reactionSummary.types.map((type) => {
                  const r = REACTION_TYPES.find(rx => rx.key === type);
                  return <span key={type}>{r?.icon || "👍"}</span>;
                })}
              </span>
              <span>{reactionSummary.total}</span>
            </div>
          )}
        </div>

        {/* Action controls under bubble */}
        <div className="flex items-center gap-3 mt-1.5 pl-2 text-xs font-semibold text-slate-500 dark:text-slate-400 relative">
          
          {/* Like / Reaction Hover Container */}
          <div 
            className="relative"
            onMouseEnter={() => {
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
              setHoveredCommentId(comment.id);
            }}
            onMouseLeave={() => {
              hoverTimeout.current = setTimeout(() => {
                setHoveredCommentId(null);
              }, 400);
            }}
          >
            <button 
              onClick={() => {
                if (userReactionKey) {
                  handleReact(comment.id, null); // remove
                } else {
                  handleReact(comment.id, "LIKE"); // default like
                }
              }}
              className={`hover:underline ${activeReaction ? activeReaction.color : "hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              {activeReaction ? activeReaction.label : "Thích"}
            </button>

            {/* Reactions Popover list */}
            {hoveredCommentId === comment.id && (
              <div 
                className="absolute bottom-5 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full px-2 py-1.5 flex gap-2.5 animate-in slide-in-from-bottom-2 duration-150 z-20"
                onMouseEnter={() => {
                  if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                }}
              >
                {REACTION_TYPES.map((rx) => (
                  <button 
                    key={rx.key} 
                    onClick={() => {
                      handleReact(comment.id, rx.key);
                      setHoveredCommentId(null);
                    }}
                    title={rx.label}
                    className="text-xl hover:scale-125 transition transform origin-bottom active:scale-95 duration-100"
                  >
                    {rx.icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isReply && session && (
            <button 
              onClick={() => {
                setReplyingToId(replyingToId === comment.id ? null : comment.id);
                setReplyContent("");
              }}
              className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
            >
              Phản hồi
            </button>
          )}

          {((session?.user as any)?.id === comment.userId) && (
            <button 
              onClick={() => {
                setEditingCommentId(comment.id);
                setEditingContent(comment.content);
              }}
              className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
            >
              Chỉnh sửa
            </button>
          )}

          {((session?.user as any)?.id === comment.userId || (session?.user as any)?.role === 'SUPER_ADMIN') && (
            <button 
              onClick={() => handleDeleteComment(comment.id)}
              className="hover:underline text-rose-500 hover:text-rose-700 font-normal"
            >
              Xóa
            </button>
          )}

          <span className="text-slate-400 font-normal select-none flex items-center gap-1.5">
            {new Date(comment.createdAt).toLocaleString("vi-VN", { hour: "numeric", minute: "numeric", day: "numeric", month: "numeric" })}
            
            {comment.editHistory && (comment.editHistory as any[]).length > 0 && (
              <button 
                onClick={() => handleShowHistory(comment.editHistory as any[])}
                className="hover:underline text-[10px] text-slate-400 font-normal hover:text-blue-500 cursor-pointer select-none"
              >
                (Đã chỉnh sửa)
              </button>
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold">Bình luận</h3>
        {postId && (
          <button 
            onClick={handleToggleBookmark}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition ${
              isBookmarked 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" 
                : "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isBookmarked ? "Đã lưu bài viết" : "Lưu bài viết"}
          </button>
        )}
      </div>

      {session ? (
        <div className="mb-10 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white shrink-0 flex items-center justify-center font-bold shadow-sm">
            {(session?.user as any)?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handlePostComment)}
              placeholder="Viết bình luận của bạn (Enter để gửi, Shift+Enter xuống dòng)..."
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-slate-800 dark:text-slate-200 focus:ring-0"
              rows={2}
            />

            {commentImagePreviews.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {commentImagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img src={preview} alt="Đính kèm" className="h-16 w-auto rounded-lg object-cover border dark:border-slate-600" />
                    <button 
                      onClick={() => handleRemovePreviewImage(idx, false)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex gap-1">
                {/* Emoji Trigger */}
                <div className="relative">
                  <button 
                    onClick={() => setShowMainEmoji(!showMainEmoji)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                  >
                    <Smile size={18} />
                  </button>
                  {showMainEmoji && (
                    <div className="absolute bottom-8 left-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-2 shadow-xl flex gap-1 z-10 flex-wrap max-w-[180px]">
                      {POPULAR_EMOJIS.map((emoji) => (
                        <button 
                          key={emoji} 
                          onClick={() => setNewComment(prev => prev + emoji)}
                          className="hover:scale-125 transition text-lg p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Image Trigger (Multiple) */}
                <label className="p-1.5 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition cursor-pointer">
                  <ImageIcon size={18} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                    onChange={(e) => handleImageChange(e, false)} 
                  />
                </label>
              </div>

              <button
                onClick={handlePostComment}
                disabled={loading || (!newComment.trim() && commentImages.length === 0)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition disabled:opacity-50 flex items-center justify-center shadow"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center mb-10 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 mb-3">Vui lòng đăng nhập để bình luận và tương tác.</p>
          <a href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
            Đăng nhập ngay
          </a>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            
            {/* Top-level comment */}
            <div className="flex gap-3 items-start">
              {comment.user?.avatarUrl ? (
                <img 
                  src={comment.user.avatarUrl} 
                  alt={comment.user.fullName} 
                  className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm" 
                />
              ) : (
                <div className="w-9 h-9 shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm shadow-sm select-none">
                  {comment.user?.fullName?.charAt(0) || "U"}
                </div>
              )}
              {renderCommentBubble(comment, false)}
            </div>

            {/* Replies (Nested Level 2) with L line connectors */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-9 pl-5 space-y-4 relative">
                {comment.replies.map((reply: any, idx: number) => (
                  <div key={reply.id} className="flex gap-2.5 items-start relative">
                    
                    {/* Curve L connector indicator */}
                    <div className="absolute left-[-15px] top-[-10px] h-[24px] w-3.5 border-l border-b border-slate-200 dark:border-slate-800 rounded-bl-lg"></div>

                    {/* Vertical line going down to the next reply if this is not the last reply */}
                    {comment.replies && idx < comment.replies.length - 1 && (
                      <div className="absolute left-[-15px] top-[14px] bottom-0 w-px bg-slate-200 dark:bg-slate-800"></div>
                    )}

                    {reply.user?.avatarUrl ? (
                      <img 
                        src={reply.user.avatarUrl} 
                        alt={reply.user.fullName} 
                        className="w-7 h-7 rounded-full object-cover shrink-0 shadow-sm" 
                      />
                    ) : (
                      <div className="w-7 h-7 shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs shadow-sm select-none">
                        {reply.user?.fullName?.charAt(0) || "U"}
                      </div>
                    )}
                    {renderCommentBubble(reply, true)}
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Form under top comment */}
            {replyingToId === comment.id && session && (
              <div className="ml-9 pl-5 flex gap-2.5 items-start relative">
                <div className="absolute left-[-15px] top-[-10px] h-6 w-3.5 border-l border-b border-slate-200 dark:border-slate-800 rounded-bl-lg"></div>
                <div className="w-7 h-7 shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                  {(session?.user as any)?.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-2 relative flex flex-col">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, () => handlePostReply(comment.id))}
                    placeholder={`Phản hồi ${comment.user?.fullName} (Enter để gửi)...`}
                    className="w-full bg-transparent border-none outline-none resize-none text-xs text-slate-800 dark:text-slate-200 focus:ring-0"
                    rows={1}
                  />

                  {replyImagePreviews.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {replyImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative inline-block">
                          <img src={preview} alt="Đính kèm" className="h-12 w-auto rounded-lg object-cover border dark:border-slate-600" />
                          <button 
                            onClick={() => handleRemovePreviewImage(idx, true)}
                            className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex gap-0.5">
                      {/* Reply Emoji Picker */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowReplyEmoji(!showReplyEmoji)}
                          className="p-1 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        >
                          <Smile size={16} />
                        </button>
                        {showReplyEmoji && (
                          <div className="absolute bottom-6 left-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-1.5 shadow-xl flex gap-1 z-10 flex-wrap max-w-[180px]">
                            {POPULAR_EMOJIS.map((emoji) => (
                              <button 
                                key={emoji} 
                                onClick={() => setReplyContent(prev => prev + emoji)}
                                className="hover:scale-125 transition text-md p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reply Image Upload (Multiple) */}
                      <label className="p-1 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                        <ImageIcon size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          className="hidden" 
                          onChange={(e) => handleImageChange(e, true)} 
                        />
                      </label>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setReplyingToId(null)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium px-2 py-1 rounded"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        disabled={loading || (!replyContent.trim() && replyImages.length === 0)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                      >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && comments.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Xem thêm bình luận"}
          </button>
        </div>
      )}
      {/* Lightbox Preview Modal */}
      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  Loader2, 
  Eye, 
  X,
  MessageSquare
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useLanguage } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";

const translations: Record<string, Record<string, any>> = {
  vi: {
    title: "Yêu cầu đồng hành",
    searchPlaceholder: "Tìm kiếm tên, email, tin nhắn...",
    statusFilter: "Tất cả trạng thái",
    statusUnread: "Mới (Chưa đọc)",
    statusRead: "Đã đọc",
    typeFilter: "Tất cả loại yêu cầu",
    colToggle: "Hiển thị cột",
    colChoose: "Chọn cột hiển thị",
    noResults: "Không tìm thấy yêu cầu đồng hành nào phù hợp.",
    pageSizeLabel: "Hiển thị",
    pageSizeSuffix: "dòng mỗi trang",
    pageDisplay: (start: number, end: number, total: number) => `Hiển thị ${start} - ${end} trên ${total} dòng`,
    thSTT: "STT",
    thSender: "Người gửi",
    thType: "Loại yêu cầu",
    thContact: "Liên hệ",
    thMessage: "Nội dung",
    thStatus: "Trạng thái",
    thDate: "Ngày gửi",
    thActions: "Hành động",
    detailsTitle: "Chi tiết Yêu cầu đồng hành",
    sentAt: "Gửi lúc",
    senderLabel: "Người gửi",
    typeLabel: "Loại hỗ trợ",
    emailLabel: "Email",
    phoneLabel: "Số điện thoại",
    phoneNotProvided: "Chưa cung cấp",
    messageLabel: "Nội dung tin nhắn",
    btnDelete: "Xóa yêu cầu",
    btnMarkRead: "Đánh dấu đã đọc",
    btnClose: "Đóng",
    alertMarkReadSuccess: "Đã đánh dấu yêu cầu đồng hành là đã đọc.",
    alertDeleteSuccess: "Đã xóa yêu cầu đồng hành thành công.",
    alertError: "Có lỗi xảy ra khi xử lý.",
    alertConnError: "Lỗi kết nối máy chủ."
  },
  en: {
    title: "Companion Requests",
    searchPlaceholder: "Search name, email, message...",
    statusFilter: "All Statuses",
    statusUnread: "New (Unread)",
    statusRead: "Read",
    typeFilter: "All request types",
    colToggle: "Show columns",
    colChoose: "Choose columns to show",
    noResults: "No matching companion requests found.",
    pageSizeLabel: "Show",
    pageSizeSuffix: "rows per page",
    pageDisplay: (start: number, end: number, total: number) => `Showing ${start} - ${end} of ${total} rows`,
    thSTT: "No.",
    thSender: "Sender",
    thType: "Request Type",
    thContact: "Contact",
    thMessage: "Message",
    thStatus: "Status",
    thDate: "Sent Date",
    thActions: "Actions",
    detailsTitle: "Companion Request Details",
    sentAt: "Sent at",
    senderLabel: "Sender",
    typeLabel: "Support Type",
    emailLabel: "Email",
    phoneLabel: "Phone Number",
    phoneNotProvided: "Not provided",
    messageLabel: "Message Content",
    btnDelete: "Delete request",
    btnMarkRead: "Mark as read",
    btnClose: "Close",
    alertMarkReadSuccess: "Successfully marked request as read.",
    alertDeleteSuccess: "Successfully deleted request.",
    alertError: "An error occurred.",
    alertConnError: "Server connection error."
  }
};

interface CompanionRequest {
  id: string;
  fullName: string;
  unit?: string;
  phone?: string;
  email: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}



export default function AdminCompanionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const COLUMN_LABELS = {
    sender: tStr.thSender,
    type: tStr.thType,
    contact: tStr.thContact,
    message: tStr.thMessage,
    status: tStr.thStatus,
    date: tStr.thDate,
  };

  const [requests, setRequests] = useState<CompanionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);

  // Table Tools State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["sender", "type", "contact", "message", "status", "date"]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<CompanionRequest | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null
  });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.push("/");
      } else {
        fetchRequests();
      }
    }
  }, [status, session, router, currentPage, pageSize, searchQuery]);

  // Handle click outside for column dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, pageSize]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      if (searchQuery) params.set("search", searchQuery);

      const res = await apiClient.request(`/companion-requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        const envelope = await res.json();
        setRequests(envelope?.data || []);
        setTotalRecords(envelope?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setActionLoading(id);
    setMessage("");
    try {
      const res = await apiClient.request(`/companion-requests/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        setMessage(tStr.alertMarkReadSuccess);
        setRequests((prev) =>
          prev.map((req) => (req.id === id ? { ...req, isRead: true } : req))
        );
        setSelectedRequest((prev) => prev && prev.id === id ? { ...prev, isRead: true } : prev);
      } else {
        setMessage(tStr.alertError);
      }
    } catch (err) {
      console.error(err);
      setMessage(tStr.alertConnError);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRequestId) return;
    setActionLoading(deleteRequestId);
    setMessage("");
    try {
      const res = await apiClient.request(`/companion-requests/${deleteRequestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        setMessage(tStr.alertDeleteSuccess);
        setRequests((prev) => prev.filter((req) => req.id !== deleteRequestId));
        setSelectedRequest(null);
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: tStr.alertError, type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi", message: tStr.alertConnError, type: "danger" });
    } finally {
      setActionLoading(null);
      setDeleteRequestId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Get unique request types for filtering
  const uniqueTypes = Array.from(new Set(requests.map((r) => r.type)));

  // Filter requests (only status and type - search is server-side)
  const filteredRequests = requests.filter((req) => {
    const matchStatus =
      statusFilter === "all" ? true :
      statusFilter === "unread" ? !req.isRead :
      req.isRead;

    const matchType =
      typeFilter === "all" ? true :
      req.type === typeFilter;

    return matchStatus && matchType;
  });

  if (sortConfig.key) {
    filteredRequests.sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortConfig.key) {
        case "sender":
          aVal = a.fullName || "";
          bVal = b.fullName || "";
          break;
        case "type":
          aVal = a.type || "";
          bVal = b.type || "";
          break;
        case "contact":
          aVal = a.email || "";
          bVal = b.email || "";
          break;
        case "message":
          aVal = a.message || "";
          bVal = b.message || "";
          break;
        case "status":
          aVal = a.isRead ? 1 : 0;
          bVal = b.isRead ? 1 : 0;
          break;
        case "date":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = (a as any)[sortConfig.key] || "";
          bVal = (b as any)[sortConfig.key] || "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Pagination calculations
  const totalItems = filteredRequests.length;

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-xl text-sm flex items-center gap-2 border border-blue-200 dark:border-blue-900/50">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {totalItems === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <p className="text-slate-500 dark:text-slate-400">{tStr.noResults}</p>
        </div>
      ) : (
        <DataTable
          data={filteredRequests}
          columns={[
            {
              key: "sender",
              title: tStr.thSender,
              sortable: true,
              render: (req) => (
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">{req.fullName}</div>
                  {req.unit && <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5"><Building size={12} /> {req.unit}</div>}
                </div>
              )
            },
            {
              key: "type",
              title: tStr.thType,
              sortable: true,
              render: (req) => (
                <span className="inline-block text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/40 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {req.type}
                </span>
              )
            },
            {
              key: "contact",
              title: tStr.thContact,
              sortable: true,
              render: (req) => (
                <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5"><Mail size={12} className="text-blue-500" /> {req.email}</div>
                  {req.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-emerald-500" /> {req.phone}</div>}
                </div>
              )
            },
            {
              key: "message",
              title: tStr.thMessage,
              sortable: true,
              render: (req) => (
                <span className="text-slate-500 dark:text-slate-400 font-medium max-w-xs truncate block">{req.message}</span>
              )
            },
            {
              key: "status",
              title: tStr.thStatus,
              sortable: true,
              render: (req) => (
                !req.isRead ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    {tStr.statusUnread.split(" ")[0]}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    {tStr.statusRead}
                  </span>
                )
              )
            },
            {
              key: "date",
              title: tStr.thDate,
              sortable: true,
              render: (req) => (
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {new Date(req.createdAt).toLocaleDateString("vi-VN")} {new Date(req.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                </span>
              )
            },
            {
              key: "actions",
              title: tStr.thActions,
              render: (req) => (
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                    title={tStr.thActions}
                  >
                    <Eye size={16} />
                  </button>
                  {!req.isRead && (
                    <button
                      onClick={() => handleMarkRead(req.id)}
                      disabled={actionLoading !== null}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition cursor-pointer disabled:opacity-50 border-none bg-transparent"
                      title={tStr.btnMarkRead}
                    >
                      {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteRequestId(req.id);
                    }}
                    disabled={actionLoading !== null}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition cursor-pointer disabled:opacity-50 border-none bg-transparent"
                    title={tStr.btnDelete}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            }
          ]}
          totalRecords={totalRecords || totalItems}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          sortKey={sortConfig.key}
          sortDirection={sortConfig.direction}
          onSort={handleSort}
          searchPlaceholder={tStr.searchPlaceholder}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={loading}
          filterNodes={
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition cursor-pointer text-slate-700 dark:text-slate-300 shadow-sm"
              >
                <option value="all">{tStr.statusFilter}</option>
                <option value="unread">{tStr.statusUnread}</option>
                <option value="read">{tStr.statusRead}</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition cursor-pointer text-slate-700 dark:text-slate-300 shadow-sm"
              >
                <option value="all">{tStr.typeFilter}</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          }
        />
      )}

      {/* Details Modal */}
      <Dialog open={selectedRequest !== null} onOpenChange={(open: boolean) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40">
            <DialogTitle>{tStr.detailsTitle}</DialogTitle>
            {selectedRequest && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tStr.sentAt}: {new Date(selectedRequest.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}</p>}
          </DialogHeader>

          {selectedRequest && (
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
              {/* Sender & Type Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/40">
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{tStr.senderLabel}</span>
                  <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{selectedRequest.fullName}</h4>
                  {selectedRequest.unit && (
                    <div className="flex items-center gap-1.5 mt-1 text-slate-600 dark:text-slate-300">
                      <Building size={14} className="text-slate-400" />
                      <span>{selectedRequest.unit}</span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider block mb-1">{tStr.typeLabel}</span>
                  <span className="inline-block text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/40 px-3 py-1 rounded-full">
                    {selectedRequest.type}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-150 dark:border-slate-700/40">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{tStr.emailLabel}</span>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                    <Mail size={16} className="text-blue-500" />
                    <a href={`mailto:${selectedRequest.email}`} className="hover:underline hover:text-blue-600">{selectedRequest.email}</a>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">{tStr.phoneLabel}</span>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                    <Phone size={16} className="text-emerald-500" />
                    {selectedRequest.phone ? (
                      <a href={`tel:${selectedRequest.phone}`} className="hover:underline">{selectedRequest.phone}</a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">{tStr.phoneNotProvided}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1"><MessageSquare size={14} /> {tStr.messageLabel}</span>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/85 leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">
                  {selectedRequest.message}
                </div>
              </div>
            </div>
          )}

          {selectedRequest && (
            <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between">
              <Button
                variant="destructive"
                onClick={() => setDeleteRequestId(selectedRequest.id)}
                disabled={actionLoading !== null}
              >
                <Trash2 size={14} className="mr-2" /> {tStr.btnDelete}
              </Button>

              <div className="flex gap-2">
                {!selectedRequest.isRead && (
                  <Button
                    onClick={() => handleMarkRead(selectedRequest.id)}
                    disabled={actionLoading !== null}
                    isLoading={actionLoading === selectedRequest.id}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {!actionLoading && <CheckCircle2 size={14} className="mr-2" />}
                    {tStr.btnMarkRead}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  {tStr.btnClose}
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteRequestId !== null}
        title={language === "vi" ? "Xác nhận xóa" : "Confirm deletion"}
        message={language === "vi" ? `Bạn có chắc chắn muốn xóa yêu cầu đồng hành này không?` : `Are you sure you want to delete this companion request?`}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRequestId(null)}
        type="danger"
        isLoading={actionLoading === deleteRequestId}
      />

      <ConfirmModal
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={() => setAlertInfo({ ...alertInfo, isOpen: false })}
        type={alertInfo.type}
        isAlert={true}
      />
    </div>
  );
}

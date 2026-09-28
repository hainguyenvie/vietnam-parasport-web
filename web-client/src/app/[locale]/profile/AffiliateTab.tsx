"use client";

import { apiClient } from "@/lib/api-client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/hooks/useTranslation";
import { toast } from "sonner";
import {
  Link as LinkIcon,
  Loader2,
  Plus,
  Copy,
  Trash2,
  ShoppingBag,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Wallet,
  Send,
  Building2,
  Smartphone,
  Banknote,
  MousePointerClick,
  Pencil,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const PLATFORMS = [
  { value: "SHOPEE", labelVi: "Shopee", labelEn: "Shopee" },
  { value: "TIKTOK", labelVi: "TikTok", labelEn: "TikTok" },
  { value: "LAZADA", labelVi: "Lazada", labelEn: "Lazada" },
  { value: "OTHER", labelVi: "Khác", labelEn: "Other" },
];

const PAYMENT_METHODS = [
  { value: "BANK", labelVi: "Ngân hàng", labelEn: "Bank" },
  { value: "MOMO", labelVi: "MoMo", labelEn: "MoMo" },
  { value: "ZALOPAY", labelVi: "ZaloPay", labelEn: "ZaloPay" },
];

const translations: Record<string, Record<string, any>> = {
  vi: {
    tabTitle: "Tiếp thị liên kết",
    tabDesc: "Quản lý link tiếp thị và theo dõi thu nhập của bạn",
    earningsSummary: "Tổng quan thu nhập",
    totalEarnings: "Tổng thu nhập",
    pendingEarnings: "Đang chờ duyệt",
    approvedEarnings: "Đã duyệt",
    paidEarnings: "Đã thanh toán",
    totalClicks: "Tổng lượt click",
    myLinks: "Link tiếp thị của tôi",
    createLink: "Tạo link tiếp thị",
    noLinks: "Chưa có link tiếp thị nào",
    noLinksDesc: "Tạo link tiếp thị đầu tiên của bạn để bắt đầu kiếm thu nhập!",
    platform: "Nền tảng",
    originalUrl: "URL gốc",
    title: "Tiêu đề",
    description: "Mô tả",
    affiliateCode: "Mã tiếp thị",
    thumbnailUrl: "URL ảnh đại diện (tùy chọn)",
    cancel: "Hủy",
    save: "Lưu",
    copyLink: "Sao chép link tracking",
    copiedToast: "Đã sao chép link tracking!",
    deleteLink: "Xóa link",
    deleteConfirmTitle: "Xóa link tiếp thị",
    deleteConfirmMsg: "Bạn có chắc chắn muốn xóa link tiếp thị này? Hành động này không thể hoàn tác.",
    confirm: "Xác nhận",
    requestPayout: "Yêu cầu thanh toán",
    payoutModalTitle: "Yêu cầu thanh toán",
    amountLabel: "Số tiền (VND)",
    paymentMethod: "Phương thức thanh toán",
    paymentInfo: "Thông tin thanh toán (Số TK/MoMo/ZaloPay)",
    requestBtn: "Gửi yêu cầu",
    linkStats: "Thống kê link",
    conversionRate: "Tỷ lệ chuyển đổi",
    deviceBreakdown: "Thiết bị",
    commissionsByStatus: "Hoa hồng theo trạng thái",
    editLink: "Chỉnh sửa link",
    editLinkTitle: "Chỉnh sửa link tiếp thị",
    saveChanges: "Lưu thay đổi",
    commissionHistory: "Lịch sử hoa hồng",
    noCommissions: "Chưa có hoa hồng nào",
    noCommissionsDesc: "Khi có đơn hàng thành công, hoa hồng của bạn sẽ xuất hiện ở đây.",
    commissionStatus: "Trạng thái",
    payoutRef: "Thanh toán",
    loadMore: "Xem thêm",
    errors: {
      loadLinks: "Không thể tải danh sách link tiếp thị.",
      loadEarnings: "Không thể tải thông tin thu nhập.",
      createLink: "Không thể tạo link tiếp thị.",
      deleteLink: "Không thể xóa link tiếp thị.",
      requestPayout: "Không thể gửi yêu cầu thanh toán.",
      server: "Lỗi kết nối máy chủ.",
      copyFailed: "Không thể sao chép link.",
      statsError: "Không thể tải thống kê link.",
      editError: "Không thể cập nhật link.",
    },
    success: {
      createLink: "Đã tạo link tiếp thị thành công!",
      deleteLink: "Đã xóa link tiếp thị!",
      requestPayout: "Yêu cầu thanh toán đã được gửi!",
    },
    platformLabels: { SHOPEE: "Shopee", TIKTOK: "TikTok", LAZADA: "Lazada", OTHER: "Khác" },
    paymentLabels: { BANK: "Ngân hàng", MOMO: "MoMo", ZALOPAY: "ZaloPay" },
  },
  en: {
    tabTitle: "Affiliate Marketing",
    tabDesc: "Manage your affiliate links and track your earnings",
    earningsSummary: "Earnings Summary",
    totalEarnings: "Total Earnings",
    pendingEarnings: "Pending",
    approvedEarnings: "Approved",
    paidEarnings: "Paid",
    totalClicks: "Total Clicks",
    myLinks: "My Affiliate Links",
    createLink: "Create Affiliate Link",
    noLinks: "No affiliate links yet",
    noLinksDesc: "Create your first affiliate link to start earning!",
    platform: "Platform",
    originalUrl: "Original URL",
    title: "Title",
    description: "Description",
    affiliateCode: "Affiliate Code",
    thumbnailUrl: "Thumbnail URL (optional)",
    cancel: "Cancel",
    save: "Save",
    copyLink: "Copy tracking link",
    copiedToast: "Tracking link copied!",
    deleteLink: "Delete link",
    deleteConfirmTitle: "Delete Affiliate Link",
    deleteConfirmMsg: "Are you sure you want to delete this affiliate link? This action cannot be undone.",
    confirm: "Confirm",
    requestPayout: "Request Payout",
    payoutModalTitle: "Request Payout",
    amountLabel: "Amount (VND)",
    paymentMethod: "Payment Method",
    paymentInfo: "Payment Info (Account/MoMo/ZaloPay)",
    requestBtn: "Submit Request",
    linkStats: "Link Stats",
    conversionRate: "Conversion Rate",
    deviceBreakdown: "Device Breakdown",
    commissionsByStatus: "Commissions by Status",
    editLink: "Edit Link",
    editLinkTitle: "Edit Affiliate Link",
    saveChanges: "Save Changes",
    commissionHistory: "Commission History",
    noCommissions: "No commissions yet",
    noCommissionsDesc: "When orders are confirmed, your commissions will appear here.",
    commissionStatus: "Status",
    payoutRef: "Payout",
    loadMore: "Load More",
    errors: {
      loadLinks: "Failed to load affiliate links.",
      loadEarnings: "Failed to load earnings information.",
      createLink: "Failed to create affiliate link.",
      deleteLink: "Failed to delete affiliate link.",
      requestPayout: "Failed to submit payout request.",
      server: "Server connection error.",
      copyFailed: "Failed to copy link.",
      statsError: "Failed to load link stats.",
      editError: "Failed to update link.",
    },
    success: {
      createLink: "Affiliate link created successfully!",
      deleteLink: "Affiliate link deleted!",
      requestPayout: "Payout request submitted!",
    },
    platformLabels: { SHOPEE: "Shopee", TIKTOK: "TikTok", LAZADA: "Lazada", OTHER: "Other" },
    paymentLabels: { BANK: "Bank", MOMO: "MoMo", ZALOPAY: "ZaloPay" },
  },
};

function formatVND(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function getPlatformColor(platform: string): string {
  switch (platform) {
    case "SHOPEE": return "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400";
    case "TIKTOK": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "LAZADA": return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
    default: return "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400";
  }
}

export default function AffiliateTab(_props: Record<string, never>) {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  // State
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);

  // Create Link Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    platform: "",
    originalUrl: "",
    title: "",
    description: "",
    affiliateCode: "",
    commissionRate: "",
    thumbnailUrl: "",
  });
  const [creating, setCreating] = useState(false);

  // Delete Link
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Payout Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    paymentMethod: "",
    paymentInfo: "",
  });
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Link Stats
  const [statsLinkId, setStatsLinkId] = useState<string | null>(null);
  const [linkStats, setLinkStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Edit Link
  const [editingLink, setEditingLink] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", thumbnailUrl: "" });
  const [saving, setSaving] = useState(false);

  // Commission History
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commPage, setCommPage] = useState(1);
  const [commTotal, setCommTotal] = useState(0);
  const [commLoading, setCommLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linksRes, earningsRes] = await Promise.all([
        apiClient.request("/affiliate/links"),
        apiClient.request("/affiliate/earnings"),
      ]);

      if (linksRes.ok) {
        const data = await linksRes.json();
        setLinks(Array.isArray(data) ? data : []);
      }
      if (earningsRes.ok) {
        setEarnings(await earningsRes.json());
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.platform || !createForm.originalUrl || !createForm.title) {
      toast.warning(language === "vi" ? "Vui lòng nhập đầy đủ nền tảng, URL và tiêu đề." : "Please fill in platform, URL, and title.");
      return;
    }
    setCreating(true);
    try {
      const res = await apiClient.request("/affiliate/links", {
        method: "POST",
        body: JSON.stringify({ ...createForm, commissionRate: Number(createForm.commissionRate) || 0 }),
      });
      if (res.ok) {
        toast.success(tStr.success.createLink);
        setShowCreateModal(false);
        setCreateForm({ platform: "", originalUrl: "", title: "", description: "", affiliateCode: "", commissionRate: "", thumbnailUrl: "" });
        fetchData();
      } else {
        toast.error(tStr.errors.createLink);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!deleteLinkId) return;
    setDeleting(true);
    try {
      const res = await apiClient.request(`/affiliate/links/${deleteLinkId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(tStr.success.deleteLink);
        setDeleteLinkId(null);
        fetchData();
      } else {
        toast.error(tStr.errors.deleteLink);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setDeleting(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.amount || !payoutForm.paymentMethod || !payoutForm.paymentInfo) {
      toast.warning(language === "vi" ? "Vui lòng nhập đầy đủ thông tin." : "Please fill in all fields.");
      return;
    }
    setRequestingPayout(true);
    try {
      const res = await apiClient.request("/affiliate/payouts/request", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(payoutForm.amount),
          paymentMethod: payoutForm.paymentMethod,
          paymentInfo: payoutForm.paymentInfo,
        }),
      });
      if (res.ok) {
        toast.success(tStr.success.requestPayout);
        setShowPayoutModal(false);
        setPayoutForm({ amount: "", paymentMethod: "", paymentInfo: "" });
        fetchData();
      } else {
        toast.error(tStr.errors.requestPayout);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.errors.server);
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleCopyLink = (shortCode: string) => {
    const trackingUrl = `${window.location.origin}/go/${shortCode}`;
    navigator.clipboard.writeText(trackingUrl).then(
      () => toast.success(tStr.copiedToast),
      () => toast.error(tStr.errors.copyFailed)
    );
  };

  const getPlatformLabel = (platform: string) => {
    return (tStr.platformLabels as any)[platform] || platform;
  };

  const getPaymentLabel = (method: string) => {
    return (tStr.paymentLabels as any)[method] || method;
  };

  const handleViewStats = async (linkId: string) => {
    setStatsLinkId(linkId);
    setStatsLoading(true);
    try {
      const res = await apiClient.request(`/affiliate/links/${linkId}/stats`);
      if (res.ok) setLinkStats(await res.json());
    } catch {
      toast.error(tStr.errors.statsError);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleEditLink = (link: any) => {
    setEditingLink(link);
    setEditForm({
      title: link.title || "",
      description: link.description || "",
      thumbnailUrl: link.thumbnailUrl || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setSaving(true);
    try {
      const res = await apiClient.request(`/affiliate/links/${editingLink.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success(language === "vi" ? "Đã cập nhật link!" : "Link updated!");
        setEditingLink(null);
        fetchData();
      } else {
        toast.error(tStr.errors.editError);
      }
    } catch {
      toast.error(tStr.errors.server);
    } finally {
      setSaving(false);
    }
  };

  const fetchCommissions = async (page?: number) => {
    setCommLoading(true);
    const p = page ?? commPage;
    try {
      const res = await apiClient.request(`/affiliate/earnings/details?page=${p}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(prev => p === 1 ? data.data : [...prev, ...data.data]);
        setCommTotal(data.pagination?.total ?? 0);
        setCommPage(p);
      }
    } catch { /* silent */ }
    finally { setCommLoading(false); }
  };

  useEffect(() => { fetchCommissions(1); }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-40 rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Earnings Summary */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" />
          {tStr.earningsSummary}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-green-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tStr.totalEarnings}</span>
            </div>
            <span className="text-xl font-extrabold text-green-600 dark:text-green-400">
              {formatVND(earnings?.totalEarnings || 0, language)}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tStr.pendingEarnings}</span>
            </div>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatVND(earnings?.pendingEarnings || 0, language)}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tStr.approvedEarnings}</span>
            </div>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {formatVND(earnings?.approvedEarnings || 0, language)}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-purple-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tStr.paidEarnings}</span>
            </div>
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
              {formatVND(earnings?.paidEarnings || 0, language)}
            </span>
          </div>
        </div>

        {/* Total clicks + Payout button */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <MousePointerClick size={13} />
            {tStr.totalClicks}: {earnings?.totalClicks || 0}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPayoutModal(true)}
            className="gap-1.5"
          >
            <Send size={14} />
            {tStr.requestPayout}
          </Button>
        </div>
      </div>

      {/* Affiliate Links */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <LinkIcon size={16} className="text-blue-500" />
            {tStr.myLinks}
          </h3>
          <Button
            onClick={() => {
              setCreateForm({ platform: "", originalUrl: "", title: "", description: "", affiliateCode: "", commissionRate: "", thumbnailUrl: "" });
              setShowCreateModal(true);
            }}
            size="sm"
            className="gap-1.5"
          >
            <Plus size={14} />
            {tStr.createLink}
          </Button>
        </div>

        {links.length === 0 ? (
          <EmptyState
            icon={<LinkIcon size={32} />}
            title={tStr.noLinks}
            description={tStr.noLinksDesc}
            action={
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="gap-1.5"
              >
                <Plus size={14} />
                {tStr.createLink}
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {links.map((link: any) => (
              <div
                key={link.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Platform badge + Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${getPlatformColor(link.platform)}`}>
                        <ShoppingBag size={10} />
                        {getPlatformLabel(link.platform)}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {link.title}
                      </h4>
                    </div>

                    {/* Original URL */}
                    {link.originalUrl && (
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                        <ExternalLink size={10} className="shrink-0" />
                        {link.originalUrl}
                      </p>
                    )}

                    {/* Description */}
                    {link.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {link.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-1">
                      {/* Tracking URL */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          /go/{link.shortCode || link.slug || link.id}
                        </span>
                        <button
                          onClick={() => handleCopyLink(link.shortCode || link.slug || link.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer"
                          title={tStr.copyLink}
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      {/* Click count */}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MousePointerClick size={10} />
                        {link.clickCount || 0} clicks
                      </span>

                      {/* Earnings */}
                      {link.earnings != null && (
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <TrendingUp size={10} />
                          {formatVND(link.earnings, language)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleViewStats(link.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition cursor-pointer"
                      title={tStr.linkStats}
                    >
                      <BarChart3 size={14} />
                    </button>
                    <button
                      onClick={() => handleEditLink(link)}
                      className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition cursor-pointer"
                      title={tStr.editLink}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteLinkId(link.id)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                      title={tStr.deleteLink}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Link Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tStr.createLink}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLink} className="p-6 space-y-4">
            {/* Platform */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.platform}
              </label>
              <select
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={createForm.platform}
                onChange={(e) => setCreateForm({ ...createForm, platform: e.target.value })}
                required
              >
                <option value="">-- {language === "vi" ? "Chọn nền tảng" : "Select platform"} --</option>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {language === "vi" ? p.labelVi : p.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.title}
              </label>
              <Input
                placeholder={language === "vi" ? "VD: Áo thể thao Nike Pro" : "e.g. Nike Pro Sports Shirt"}
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
            </div>

            {/* Original URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.originalUrl}
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={createForm.originalUrl}
                onChange={(e) => setCreateForm({ ...createForm, originalUrl: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.description}
              </label>
              <Input
                placeholder={language === "vi" ? "Mô tả ngắn về sản phẩm" : "Short product description"}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>

            {/* Affiliate Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.affiliateCode}
              </label>
              <Input
                placeholder={language === "vi" ? "Mã tiếp thị của bạn" : "Your affiliate code"}
                value={createForm.affiliateCode}
                onChange={(e) => setCreateForm({ ...createForm, affiliateCode: e.target.value })}
              />
            </div>

            {/* Commission Rate */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === "vi" ? "Tỷ lệ hoa hồng (%)" : "Commission Rate (%)"}
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="5"
                value={createForm.commissionRate}
                onChange={(e) => setCreateForm({ ...createForm, commissionRate: e.target.value })}
              />
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.thumbnailUrl}
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={createForm.thumbnailUrl}
                onChange={(e) => setCreateForm({ ...createForm, thumbnailUrl: e.target.value })}
              />
            </div>

            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                {tStr.cancel}
              </Button>
              <Button type="submit" isLoading={creating}>
                {tStr.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteLinkId !== null}
        title={tStr.deleteConfirmTitle}
        message={tStr.deleteConfirmMsg}
        confirmText={tStr.confirm}
        onConfirm={handleDeleteLink}
        onCancel={() => setDeleteLinkId(null)}
        type="danger"
      />

      {/* Payout Request Modal */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tStr.payoutModalTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestPayout} className="p-6 space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.amountLabel}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="100000"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  required
                  min="10000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  VND
                </span>
              </div>
              {earnings?.pendingEarnings > 0 && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === "vi" ? "Số dư đang chờ:" : "Pending balance:"} {formatVND(earnings.pendingEarnings, language)}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.paymentMethod}
              </label>
              <select
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={payoutForm.paymentMethod}
                onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                required
              >
                <option value="">-- {language === "vi" ? "Chọn phương thức" : "Select method"} --</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {language === "vi" ? m.labelVi : m.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Info */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tStr.paymentInfo}
              </label>
              <Input
                placeholder={
                  language === "vi"
                    ? "VD: 0123456789 - Ngân hàng Vietcombank"
                    : "e.g. 0123456789 - Vietcombank"
                }
                value={payoutForm.paymentInfo}
                onChange={(e) => setPayoutForm({ ...payoutForm, paymentInfo: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setShowPayoutModal(false)}>
                {tStr.cancel}
              </Button>
              <Button type="submit" isLoading={requestingPayout}>
                <Send size={14} className="mr-1" />
                {tStr.requestBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Stats Dialog */}
      <Dialog open={statsLinkId !== null} onOpenChange={() => { setStatsLinkId(null); setLinkStats(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tStr.linkStats}</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
            ) : linkStats?.stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold text-blue-600">{linkStats.stats.totalClicks}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Click" : "Clicks"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold text-emerald-600">{linkStats.stats.conversionRate}%</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{tStr.conversionRate}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold text-amber-600">{formatVND(linkStats.stats.totalCommissionEarned, language)}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Thu nhập" : "Earnings"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{tStr.deviceBreakdown}</p>
                  <div className="flex gap-2 text-xs">
                    {Object.entries(linkStats.stats.clicksByDevice).map(([device, count]) => (
                      <span key={device} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold">
                        {device}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{tStr.commissionsByStatus}</p>
                  <div className="flex gap-2 text-xs flex-wrap">
                    {Object.entries(linkStats.stats.commissionsByStatus).map(([status, count]) => (
                      <span key={status} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold">
                        {status}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-sm text-slate-400">{tStr.errors.statsError}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={editingLink !== null} onOpenChange={() => setEditingLink(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tStr.editLinkTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tStr.title}</label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tStr.description}</label>
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tStr.thumbnailUrl}</label>
              <Input type="url" placeholder="https://..." value={editForm.thumbnailUrl} onChange={(e) => setEditForm({ ...editForm, thumbnailUrl: e.target.value })} />
            </div>
            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setEditingLink(null)}>{tStr.cancel}</Button>
              <Button type="submit" isLoading={saving}>{tStr.saveChanges}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Commission History */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign size={16} className="text-green-500" />
          {tStr.commissionHistory}
        </h3>
        {commLoading && commissions.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : commissions.length > 0 ? (
          <div className="space-y-2">
            {commissions.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {c.link?.title || c.product?.name || (language === "vi" ? "Hoa hồng" : "Commission")}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                    {c.payout && ` · ${tStr.payoutRef}: ${formatVND(c.payout.amount, language)}`}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatVND(c.commissionAmount, language)}
                  </p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    c.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
                    c.status === "PAID" ? "bg-purple-100 text-purple-700" :
                    c.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    c.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
            {commissions.length < commTotal && (
              <button
                onClick={() => fetchCommissions(commPage + 1)}
                disabled={commLoading}
                className="w-full py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {commLoading ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                {tStr.loadMore}
              </button>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<DollarSign size={24} />}
            title={tStr.noCommissions}
            description={tStr.noCommissionsDesc}
          />
        )}
      </div>
    </div>
  );
}

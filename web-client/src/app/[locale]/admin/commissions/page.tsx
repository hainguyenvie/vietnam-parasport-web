"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import {
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Send,
  Eye,
  Download,
  CheckSquare,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { UserHoverCard } from "@/components/UserHoverCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface CommissionRecord {
  id: string;
  athleteName: string;
  athleteId: string;
  linkShortCode: string | null;
  productName: string | null;
  platform: string | null;
  orderId: string | null;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface PayoutRecord {
  id: string;
  athleteName: string;
  athleteId: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  referenceId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, Record<string, string>> = {
  vi: {
    PENDING: "Chờ duyệt",
    CONFIRMED: "Đã xác nhận",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    PAID: "Đã thanh toán",
    PROCESSING: "Đang xử lý",
    COMPLETED: "Hoàn tất",
    FAILED: "Thất bại",
  },
  en: {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    PAID: "Paid",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    FAILED: "Failed",
  },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  PAID: "bg-violet-100 text-violet-700",
  PROCESSING: "bg-cyan-100 text-cyan-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

const PLATFORM_LABELS: Record<string, string> = {
  SHOPEE: "Shopee",
  TIKTOK: "TikTok Shop",
  LAZADA: "Lazada",
  OTHER: "Khác",
};

export default function AdminCommissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState("commissions");
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [commissionPage, setCommissionPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Detail modal
  const [viewingCommission, setViewingCommission] = useState<CommissionRecord | null>(null);
  const [processingPayout, setProcessingPayout] = useState<PayoutRecord | null>(null);
  const [confirmProcessPayout, setConfirmProcessPayout] = useState<PayoutRecord | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // KPI stats
  const [kpiStats, setKpiStats] = useState({ pendingCount: 0, approvedUnpaid: 0, totalCount: 0, avgDays: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    setCommissionPage(1);
  }, [searchQuery]);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(commissionPage));
      params.set("limit", String(pageSize));
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await apiClient.get<any>(`/commissions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data || [];
        const total = data.total || data.meta?.total || items.length;
        const mapped: CommissionRecord[] = (Array.isArray(items) ? items : []).map((item: any) => ({
          id: item.id,
          athleteName: item.athlete?.user?.fullName || item.athleteId,
          athleteId: item.athleteId,
          linkShortCode: item.link?.shortCode || null,
          productName: item.product?.name || null,
          platform: item.platform || null,
          orderId: item.orderId || null,
          orderAmount: item.orderAmount ?? 0,
          commissionRate: item.commissionRate ?? 0,
          commissionAmount: item.commissionAmount ?? 0,
          status: item.status,
          notes: item.notes || null,
          approvedAt: item.approvedAt || null,
          createdAt: item.createdAt,
        }));
        setCommissions(mapped);
        setTotalCommissions(total);
      }
    } catch (err) {
      console.error("Failed to fetch commissions:", err);
    } finally {
      setLoading(false);
    }
  }, [commissionPage, pageSize, statusFilter, searchQuery]);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(payoutPage));
      params.set("limit", String(pageSize));

      const res = await apiClient.get<any>(`/payouts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data || [];
        const total = data.total || data.meta?.total || items.length;
        const mapped: PayoutRecord[] = (Array.isArray(items) ? items : []).map((item: any) => ({
          id: item.id,
          athleteName: item.athlete?.user?.fullName || item.athleteId,
          athleteId: item.athleteId,
          amount: item.amount ?? 0,
          status: item.status,
          paymentMethod: item.paymentMethod || null,
          referenceId: item.referenceId || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
        setPayouts(mapped);
        setTotalPayouts(total);
      }
    } catch (err) {
      console.error("Failed to fetch payouts:", err);
    } finally {
      setLoading(false);
    }
  }, [payoutPage, pageSize]);

  useEffect(() => {
    if (status === "authenticated") {
      if (activeTab === "commissions") fetchCommissions();
      else fetchPayouts();
    }
  }, [status, activeTab, fetchCommissions, fetchPayouts]);

  const handleApprove = async (id: string) => {
    try {
      const res = await apiClient.put(`/commissions/${id}/approve`, {});
      if (res.ok) {
        setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: "APPROVED" } : c));
        toast.success(language === "vi" ? "Đã duyệt hoa hồng thành công!" : "Commission approved!");
      } else {
        toast.error(language === "vi" ? "Không thể duyệt hoa hồng." : "Failed to approve commission.");
      }
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối máy chủ." : "Server connection error.");
    }
    setViewingCommission(null);
  };

  const handleReject = async (id: string) => {
    try {
      const res = await apiClient.put(`/commissions/${id}/reject`, { notes: rejectNotes });
      if (res.ok) {
        setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: "REJECTED", notes: rejectNotes } : c));
        toast.success(language === "vi" ? "Đã từ chối hoa hồng." : "Commission rejected.");
      } else {
        toast.error(language === "vi" ? "Không thể từ chối hoa hồng." : "Failed to reject commission.");
      }
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối máy chủ." : "Server connection error.");
    }
    setViewingCommission(null);
    setRejectNotes("");
  };

  const handleProcessPayout = async () => {
    if (!processingPayout) return;
    try {
      const res = await apiClient.put(`/payouts/${processingPayout.id}/process`, { status: "COMPLETED" });
      if (res.ok) {
        setPayouts(prev => prev.map(p => p.id === processingPayout.id ? { ...p, status: "COMPLETED" } : p));
        toast.success(language === "vi" ? "Đã xử lý thanh toán thành công!" : "Payout processed successfully!");
      } else {
        toast.error(language === "vi" ? "Không thể xử lý thanh toán." : "Failed to process payout.");
      }
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối máy chủ." : "Server connection error.");
    }
    setProcessingPayout(null);
  };

  // KPI
  const fetchKPI = async () => {
    try {
      const res = await apiClient.get<any>("/commissions?limit=1000");
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data.data?.data || data.data || [];
        const all: any[] = Array.isArray(items) ? items : [];
        const pending = all.filter((c: any) => c.status === "PENDING" || c.status === "CONFIRMED");
        const approved = all.filter((c: any) => c.status === "APPROVED");
        const withDates = all.filter((c: any) => c.approvedAt && c.createdAt);
        const avgDays = withDates.length > 0
          ? Math.round(withDates.reduce((s: number, c: any) => s + (new Date(c.approvedAt!).getTime() - new Date(c.createdAt).getTime()) / 86400000, 0) / withDates.length)
          : 0;
        setKpiStats({ pendingCount: pending.length, approvedUnpaid: approved.length, totalCount: all.length, avgDays });
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchKPI(); }, []);

  // Bulk
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === commissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(commissions.map(c => c.id)));
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    let ok = 0;
    for (const id of selectedIds) {
      try {
        const res = await apiClient.put(`/commissions/${id}/approve`, {});
        if (res.ok) ok++;
      } catch { /* continue */ }
    }
    setCommissions(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, status: "APPROVED" } : c));
    toast.success(language === "vi" ? `Đã duyệt ${ok}/${selectedIds.size} hoa hồng!` : `Approved ${ok}/${selectedIds.size} commissions!`);
    setSelectedIds(new Set());
    setBulkLoading(false);
  };

  // CSV export
  const exportCSV = () => {
    const data = activeTab === "commissions" ? commissions : payouts;
    if (!data.length) return;
    const headers = activeTab === "commissions"
      ? ["Athlete", "Source", "Order Amount", "Commission", "Status", "Date"]
      : ["Athlete", "Amount", "Method", "Status", "Date"];
    const rows = data.map((r: any) => activeTab === "commissions"
      ? [r.athleteName, r.linkShortCode || r.productName || "", r.orderAmount, r.commissionAmount, r.status, new Date(r.createdAt).toLocaleDateString()]
      : [r.athleteName, r.amount, r.paymentMethod || "", r.status, new Date(r.createdAt).toLocaleDateString()]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);

  const commissionColumns: ColumnDef<CommissionRecord>[] = [
    {
      key: "select",
      title: "",
      sortable: false,
      render: (item) => (
        <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" />
      ),
    } as ColumnDef<CommissionRecord>,
    {
      key: "athleteName",
      title: language === "vi" ? "VĐV" : "Athlete",
      sortable: true,
      render: (item) => (
        <UserHoverCard userId={item.athleteId} language={language}>
          <span className="font-semibold text-slate-800 dark:text-white">{item.athleteName}</span>
        </UserHoverCard>
      ),
    },
    {
      key: "source",
      title: language === "vi" ? "Nguồn" : "Source",
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          {item.linkShortCode && <span className="text-blue-600">/{item.linkShortCode}</span>}
          {item.productName && <span className="text-slate-600 block text-xs">{item.productName}</span>}
          {item.platform && <span className="text-slate-400 block text-xs">{PLATFORM_LABELS[item.platform] || item.platform}</span>}
        </div>
      ),
    },
    {
      key: "orderAmount",
      title: language === "vi" ? "Đơn hàng" : "Order",
      sortable: true,
      render: (item) => <span className="text-sm font-medium">{formatCurrency(item.orderAmount)}</span>,
    },
    {
      key: "commission",
      title: language === "vi" ? "Hoa hồng" : "Commission",
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          <span className="font-semibold text-emerald-600">{formatCurrency(item.commissionAmount)}</span>
          <span className="text-slate-400 text-xs ml-1">({item.commissionRate}%)</span>
        </div>
      ),
    },
    {
      key: "status",
      title: language === "vi" ? "Trạng thái" : "Status",
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[item.status] || "bg-slate-100 text-slate-600"}`}>
          {STATUS_LABELS[language]?.[item.status] || item.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: language === "vi" ? "Ngày tạo" : "Created",
      sortable: true,
      render: (item) => <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>,
    },
    {
      key: "actions",
      title: language === "vi" ? "Thao tác" : "Actions",
      render: (item) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewingCommission(item)}>
            <Eye size={16} />
          </Button>
          {item.status === "PENDING" && (
            <Button variant="ghost" size="sm" onClick={() => handleApprove(item.id)} className="text-emerald-600">
              <CheckCircle size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const payoutColumns: ColumnDef<PayoutRecord>[] = [
    {
      key: "athleteName",
      title: language === "vi" ? "VĐV" : "Athlete",
      sortable: true,
      render: (item) => (
        <UserHoverCard userId={item.athleteId} language={language}>
          <span className="font-semibold text-slate-800 dark:text-white">{item.athleteName}</span>
        </UserHoverCard>
      ),
    },
    {
      key: "amount",
      title: language === "vi" ? "Số tiền" : "Amount",
      sortable: true,
      render: (item) => <span className="font-semibold text-emerald-600">{formatCurrency(item.amount)}</span>,
    },
    {
      key: "paymentMethod",
      title: language === "vi" ? "Phương thức" : "Method",
      sortable: true,
      render: (item) => <span className="text-sm text-slate-600">{item.paymentMethod || "—"}</span>,
    },
    {
      key: "status",
      title: language === "vi" ? "Trạng thái" : "Status",
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[item.status] || "bg-slate-100 text-slate-600"}`}>
          {STATUS_LABELS[language]?.[item.status] || item.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: language === "vi" ? "Ngày tạo" : "Created",
      sortable: true,
      render: (item) => <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>,
    },
    {
      key: "actions",
      title: language === "vi" ? "Thao tác" : "Actions",
      render: (item) => (
        item.status === "PENDING" && (
          <Button size="sm" variant="outline" onClick={() => setConfirmProcessPayout(item)}>
            <Send size={14} className="mr-1" />
            {language === "vi" ? "Xử lý" : "Process"}
          </Button>
        )
      ),
    },
  ];

  const statusCounts = commissions.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort logic
  if (sortConfig.key && sortConfig.direction) {
    const sortFn = (a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "athleteName": aVal = a.athleteName || ""; bVal = b.athleteName || ""; break;
        case "source": aVal = a.linkShortCode || ""; bVal = b.linkShortCode || ""; break;
        case "orderAmount": aVal = a.orderAmount; bVal = b.orderAmount; break;
        case "commission": aVal = a.commissionAmount; bVal = b.commissionAmount; break;
        case "status": aVal = a.status || ""; bVal = b.status || ""; break;
        case "createdAt": aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
        case "amount": aVal = a.amount; bVal = b.amount; break;
        case "paymentMethod": aVal = a.paymentMethod || ""; bVal = b.paymentMethod || ""; break;
        default: return 0;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    };
    commissions.sort(sortFn);
    payouts.sort(sortFn);
  }

  const commissionFilterNodes = (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setStatusFilter("")}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${!statusFilter ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
      >
        {language === "vi" ? "Tất cả" : "All"}
        <span className="ml-1 opacity-70">({commissions.length})</span>
      </button>
      {["PENDING", "CONFIRMED", "APPROVED", "REJECTED", "PAID"].map(s => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
        >
          {STATUS_LABELS[language]?.[s] || s}
          {statusCounts[s] ? <span className="ml-1 opacity-70">({statusCounts[s]})</span> : null}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab buttons */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setActiveTab("commissions"); setViewingCommission(null); }}
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold transition ${
            activeTab === "commissions"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
          }`}
        >
          <DollarSign size={16} className="mr-1.5" />
          {language === "vi" ? "Hoa hồng" : "Commissions"}
        </button>
        <button
          onClick={() => { setActiveTab("payouts"); setViewingCommission(null); }}
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold transition ${
            activeTab === "payouts"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
          }`}
        >
          <Send size={16} className="mr-1.5" />
          {language === "vi" ? "Thanh toán" : "Payouts"}
        </button>
      </div>

      {/* KPI Cards */}
      {activeTab === "commissions" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-amber-500" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Chờ xử lý" : "Pending"}</span>
            </div>
            <p className="text-xl font-extrabold text-amber-600">{kpiStats.pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-blue-500" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Đã duyệt chưa trả" : "Approved Unpaid"}</span>
            </div>
            <p className="text-xl font-extrabold text-blue-600">{kpiStats.approvedUnpaid}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Tổng hoa hồng" : "Total"}</span>
            </div>
            <p className="text-xl font-extrabold text-emerald-600">{kpiStats.totalCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-purple-500" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "T/g duyệt TB" : "Avg Approval"}</span>
            </div>
            <p className="text-xl font-extrabold text-purple-600">{kpiStats.avgDays > 0 ? `${kpiStats.avgDays}d` : "—"}</p>
          </div>
        </div>
      )}

      {/* Toolbar: Bulk actions + Export */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {activeTab === "commissions" && selectedIds.size > 0 && (
            <Button size="sm" variant="outline" onClick={handleBulkApprove} isLoading={bulkLoading} className="gap-1 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700">
              <CheckCircle size={14} /> {language === "vi" ? `Duyệt ${selectedIds.size} đã chọn` : `Approve ${selectedIds.size} selected`}
            </Button>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
          <Download size={14} /> CSV
        </Button>
      </div>

      {activeTab === "commissions" && (
        <div className="mt-4 space-y-4">
          <DataTable
            data={commissions}
            columns={commissionColumns}
            totalRecords={totalCommissions}
            page={commissionPage}
            pageSize={pageSize}
            onPageChange={setCommissionPage}
            onPageSizeChange={setPageSize}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={language === "vi" ? "Tìm theo tên VĐV hoặc link..." : "Search by athlete or link..."}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            filterNodes={commissionFilterNodes}
            isLoading={loading}
          />
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="mt-4">
          <DataTable
            data={payouts}
            columns={payoutColumns}
            totalRecords={totalPayouts}
            page={payoutPage}
            pageSize={pageSize}
            onPageChange={setPayoutPage}
            onPageSizeChange={setPageSize}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={language === "vi" ? "Tìm theo tên VĐV..." : "Search by athlete..."}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            isLoading={loading}
          />
        </div>
      )}

      {/* Commission Detail Modal */}
      <Dialog open={viewingCommission !== null} onOpenChange={(open: boolean) => !open && setViewingCommission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Chi tiết Hoa hồng" : "Commission Detail"}</DialogTitle>
          </DialogHeader>
          {viewingCommission && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "VĐV" : "Athlete"}</span>
                  <p className="font-semibold">{viewingCommission.athleteName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Nền tảng" : "Platform"}</span>
                  <p className="font-semibold">{PLATFORM_LABELS[viewingCommission.platform || ""] || viewingCommission.platform || "—"}</p>
                </div>
              </div>
              {viewingCommission.linkShortCode && (
                <div>
                  <span className="text-xs text-slate-500 block">Affiliate Link</span>
                  <p className="text-blue-600 font-mono text-sm">/{viewingCommission.linkShortCode}</p>
                </div>
              )}
              {viewingCommission.productName && (
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Sản phẩm" : "Product"}</span>
                  <p>{viewingCommission.productName}</p>
                </div>
              )}
              {viewingCommission.orderId && (
                <div>
                  <span className="text-xs text-slate-500 block">Order ID</span>
                  <p className="font-mono text-sm">{viewingCommission.orderId}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <div className="text-center">
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Giá trị đơn" : "Order Value"}</span>
                  <p className="font-bold">{formatCurrency(viewingCommission.orderAmount)}</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Tỷ lệ" : "Rate"}</span>
                  <p className="font-bold">{viewingCommission.commissionRate}%</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Hoa hồng" : "Commission"}</span>
                  <p className="font-bold text-emerald-600">{formatCurrency(viewingCommission.commissionAmount)}</p>
                </div>
              </div>
              {viewingCommission.notes && (
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Ghi chú" : "Notes"}</span>
                  <p className="text-sm">{viewingCommission.notes}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500 block">{language === "vi" ? "Trạng thái" : "Status"}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[viewingCommission.status]}`}>
                  {STATUS_LABELS[language]?.[viewingCommission.status] || viewingCommission.status}
                </span>
              </div>

              {viewingCommission.status === "PENDING" && (
                <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">
                      {language === "vi" ? "Ghi chú từ chối (tùy chọn)" : "Rejection notes (optional)"}
                    </label>
                    <textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(viewingCommission.id)}>
                      <CheckCircle size={16} className="mr-2" />
                      {language === "vi" ? "Duyệt" : "Approve"}
                    </Button>
                    <Button className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={() => handleReject(viewingCommission.id)}>
                      <XCircle size={16} className="mr-2" />
                      {language === "vi" ? "Từ chối" : "Reject"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payout Modal */}
      <Dialog open={processingPayout !== null} onOpenChange={(open: boolean) => !open && setProcessingPayout(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Xử lý thanh toán" : "Process Payout"}</DialogTitle>
          </DialogHeader>
          {processingPayout && (
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-500 block">{language === "vi" ? "VĐV" : "Athlete"}</span>
                <p className="font-semibold">{processingPayout.athleteName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{language === "vi" ? "Số tiền" : "Amount"}</span>
                <p className="font-bold text-emerald-600 text-lg">{formatCurrency(processingPayout.amount)}</p>
              </div>
              {processingPayout.paymentMethod && (
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Phương thức" : "Method"}</span>
                  <p>{processingPayout.paymentMethod}</p>
                </div>
              )}
              <div className="pt-4">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleProcessPayout}>
                  <Send size={16} className="mr-2" />
                  {language === "vi" ? "Xác nhận đã thanh toán" : "Confirm Payment Sent"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={confirmProcessPayout !== null}
        title={language === "vi" ? "Xác nhận xử lý" : "Confirm Processing"}
        message={
          language === "vi"
            ? `Bạn có chắc chắn muốn đánh dấu khoản thanh toán ${formatCurrency(confirmProcessPayout?.amount || 0)} của ${confirmProcessPayout?.athleteName} là đã hoàn tất?`
            : `Are you sure you want to mark the payout of ${formatCurrency(confirmProcessPayout?.amount || 0)} for ${confirmProcessPayout?.athleteName} as completed?`
        }
        confirmText={language === "vi" ? "Xác nhận" : "Confirm"}
        onConfirm={() => {
          if (confirmProcessPayout) {
            setProcessingPayout(confirmProcessPayout);
            setConfirmProcessPayout(null);
          }
        }}
        onCancel={() => setConfirmProcessPayout(null)}
        type="warning"
      />
    </div>
  );
}

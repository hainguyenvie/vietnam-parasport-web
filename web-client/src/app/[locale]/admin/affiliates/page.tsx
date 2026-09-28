"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import {
  LinkIcon,
  ExternalLink,
  Copy,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";

import { UserHoverCard } from "@/components/UserHoverCard";

interface AffiliateLinkRecord {
  id: string;
  shortCode: string;
  originalUrl: string;
  productName: string | null;
  platform: string | null;
  athleteName: string;
  athleteId: string;
  athleteEmail: string;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
}

interface SummaryStats {
  totalLinks: number;
  totalClicks: number;
  totalCommissions: number;
  totalEarnings: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  SHOPEE: "Shopee",
  TIKTOK: "TikTok Shop",
  LAZADA: "Lazada",
  OTHER: "Khác",
};

function formatVND(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function AdminAffiliatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();

  const [links, setLinks] = useState<AffiliateLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SummaryStats>({ totalLinks: 0, totalClicks: 0, totalCommissions: 0, totalEarnings: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [viewingLink, setViewingLink] = useState<AffiliateLinkRecord | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      if (searchQuery) params.set("search", searchQuery);

      const res = await apiClient.get<any>(`/affiliate/admin/links?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data || [];
        const mapped: AffiliateLinkRecord[] = (Array.isArray(items) ? items : []).map((item: any) => ({
          id: item.id,
          shortCode: item.shortCode || "",
          originalUrl: item.originalUrl || "",
          productName: item.productName || null,
          platform: item.platform || null,
          athleteName: item.athlete?.user?.fullName || "N/A",
          athleteId: item.athleteId || item.athlete?.id || undefined,
          athleteEmail: item.athlete?.user?.email || "",
          isActive: item.isActive ?? true,
          clickCount: item._count?.clicks ?? 0,
          createdAt: item.createdAt,
        }));
        setLinks(mapped);
        setTotalRecords(data.total || items.length);
        setStats(prev => ({ ...prev, totalLinks: data.total || items.length }));
      }
    } catch (err) {
      console.error("Failed to fetch affiliate links:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const [linksRes, commRes, compRes] = await Promise.all([
        apiClient.get<any>("/affiliate/admin/links?limit=1000"),
        apiClient.get<any>("/commissions?limit=1000"),
        apiClient.get<any>("/payouts?status=COMPLETED&limit=1000"),
      ]);

      if (linksRes.ok) {
        const data = await linksRes.json();
        const items = data.items || data || [];
        const allLinks: any[] = Array.isArray(items) ? items : [];
        setStats(prev => ({
          ...prev,
          totalLinks: data.total || allLinks.length,
          totalClicks: allLinks.reduce((sum: number, l: any) => sum + (l._count?.clicks ?? l.clickCount ?? 0), 0),
        }));
      }

      if (commRes.ok) {
        const commData = await commRes.json();
        const commItems = commData.items || commData.data?.data || commData.data || [];
        const commArr: any[] = Array.isArray(commItems) ? commItems : [];
        const totalCommAmount = commArr.reduce((sum: number, c: any) => sum + (c.commissionAmount ?? 0), 0);
        setStats(prev => ({ ...prev, totalCommissions: totalCommAmount }));
      }

      if (compRes.ok) {
        const payoutData = await compRes.json();
        const payoutItems = payoutData.items || payoutData.data?.data || payoutData.data || [];
        const payoutArr: any[] = Array.isArray(payoutItems) ? payoutItems : [];
        const totalPaidOut = payoutArr.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);
        setStats(prev => ({ ...prev, totalEarnings: totalPaidOut }));
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchLinks();
      fetchStats();
    }
  }, [status, fetchLinks, fetchStats]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCopyLink = (shortCode: string) => {
    const url = `${window.location.origin}/go/${shortCode}`;
    navigator.clipboard.writeText(url).catch(() => {
      // Clipboard API denied — silent fail is intentional
    });
  };

  const columns: ColumnDef<AffiliateLinkRecord>[] = [
    {
      key: "athleteName",
      title: language === "vi" ? "VĐV" : "Athlete",
      sortable: true,
      render: (item) => (
        <div>
          {item.athleteId ? (
            <UserHoverCard userId={item.athleteId!} language={language}>
              <span className="font-semibold text-slate-800 dark:text-white">{item.athleteName}</span>
            </UserHoverCard>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-white">{item.athleteName}</span>
          )}
          <span className="text-xs text-slate-400 block">{item.athleteEmail}</span>
        </div>
      ),
    },
    {
      key: "shortCode",
      title: language === "vi" ? "Link rút gọn" : "Short Link",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <code className="text-blue-600 text-sm font-mono bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
            /go/{item.shortCode}
          </code>
          <button
            onClick={() => handleCopyLink(item.shortCode)}
            className="text-slate-400 hover:text-blue-600 transition"
            title={language === "vi" ? "Sao chép" : "Copy"}
          >
            <Copy size={14} />
          </button>
        </div>
      ),
    },
    {
      key: "productName",
      title: language === "vi" ? "Sản phẩm" : "Product",
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          {item.productName && <span>{item.productName}</span>}
          {item.platform && (
            <span className="text-slate-400 block text-xs">
              {PLATFORM_LABELS[item.platform] || item.platform}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "clickCount",
      title: language === "vi" ? "Lượt click" : "Clicks",
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center gap-1 font-semibold">
          <BarChart3 size={14} className="text-slate-400" />
          {item.clickCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "isActive",
      title: language === "vi" ? "Trạng thái" : "Status",
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
          item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}>
          {item.isActive
            ? (language === "vi" ? "Đang hoạt động" : "Active")
            : (language === "vi" ? "Tạm dừng" : "Inactive")}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: language === "vi" ? "Ngày tạo" : "Created",
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
        </span>
      ),
    },
    {
      key: "actions",
      title: language === "vi" ? "Thao tác" : "Actions",
      render: (item) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewingLink(item)}>
            <Eye size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.open(item.originalUrl, "_blank")}>
            <ExternalLink size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const statCards = [
    {
      label: language === "vi" ? "Tổng link" : "Total Links",
      value: stats.totalLinks.toLocaleString(),
      icon: <LinkIcon size={20} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: language === "vi" ? "Tổng click" : "Total Clicks",
      value: stats.totalClicks.toLocaleString(),
      icon: <TrendingUp size={20} />,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: language === "vi" ? "Hoa hồng" : "Commissions",
      value: formatVND(stats.totalCommissions, language),
      icon: <DollarSign size={20} />,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: language === "vi" ? "Đã thanh toán" : "Paid Out",
      value: formatVND(stats.totalEarnings, language),
      icon: <Users size={20} />,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">{card.label}</span>
              <span className={`p-2 rounded-lg ${card.color}`}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Links table */}
      <DataTable
        data={links}
        columns={columns}
        totalRecords={totalRecords}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={language === "vi" ? "Tìm theo VĐV, link hoặc sản phẩm..." : "Search by athlete, link or product..."}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        isLoading={loading}
      />

      {/* Detail Modal */}
      <Dialog open={viewingLink !== null} onOpenChange={(open: boolean) => !open && setViewingLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Chi tiết Affiliate Link" : "Affiliate Link Detail"}</DialogTitle>
          </DialogHeader>
          {viewingLink && (
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-500 block">{language === "vi" ? "VĐV" : "Athlete"}</span>
                <p className="font-semibold">{viewingLink.athleteName}</p>
                <p className="text-xs text-slate-400">{viewingLink.athleteEmail}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Short Code</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-blue-600 font-mono bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded text-sm">
                    /go/{viewingLink.shortCode}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => handleCopyLink(viewingLink.shortCode)}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{language === "vi" ? "URL gốc" : "Original URL"}</span>
                <a href={viewingLink.originalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                  {viewingLink.originalUrl}
                </a>
              </div>
              {viewingLink.platform && (
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Nền tảng" : "Platform"}</span>
                  <p className="font-semibold">{PLATFORM_LABELS[viewingLink.platform] || viewingLink.platform}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <div className="text-center">
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Lượt click" : "Clicks"}</span>
                  <p className="font-bold text-lg">{viewingLink.clickCount.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Trạng thái" : "Status"}</span>
                  <p className={`font-bold text-sm ${viewingLink.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                    {viewingLink.isActive
                      ? (language === "vi" ? "Hoạt động" : "Active")
                      : (language === "vi" ? "Tạm dừng" : "Inactive")}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Ngày tạo" : "Created"}</span>
                  <p className="font-bold text-sm">{new Date(viewingLink.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  FileText
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { UserHoverCard } from "@/components/UserHoverCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";

interface AssistantProfile {
  id: string;
  userId: string;
  fullName: string;
  athleteName: string;
  athleteId: string;
  supportArea: string;
  medicalCertUrl: string | null;
  medicalDesc: string | null;
  isVerified: boolean;
  createdAt: string;
}

const SUPPORT_AREA_LABELS: Record<string, Record<string, string>> = {
  vi: { MEDICAL: "Y tế", MOBILITY: "Di chuyển", LOGISTICS: "Hậu cần", OTHER: "Khác" },
  en: { MEDICAL: "Medical", MOBILITY: "Mobility", LOGISTICS: "Logistics", OTHER: "Other" },
};

export default function AdminAssistantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();

  const [assistants, setAssistants] = useState<AssistantProfile[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewingAssistant, setViewingAssistant] = useState<AssistantProfile | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", supportArea: "OTHER", medicalDesc: "", medicalCertUrl: "" });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  const fetchAssistants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      if (searchQuery) params.set("search", searchQuery);

      const res = await apiClient.get<any>(`/assistant-profiles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        const mapped: AssistantProfile[] = items.map((item: any) => ({
          id: item.id,
          userId: item.userId || item.user?.id || undefined,
          fullName: item.user?.fullName || "N/A",
          athleteName: item.athlete?.fullName || item.athleteId || "—",
          athleteId: item.athleteId || item.athlete?.id || undefined,
          supportArea: item.supportArea || "OTHER",
          medicalCertUrl: item.medicalCertUrl || null,
          medicalDesc: item.medicalDesc || null,
          isVerified: item.isVerified ?? false,
          createdAt: item.createdAt,
        }));
        setAssistants(mapped);
        setTotalRecords(data.total || items.length);
      }
    } catch (err) {
      console.error("Failed to fetch assistant profiles:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAssistants();
    }
  }, [status, fetchAssistants]);

  const handleUpdateStatus = async (id: string, isVerified: boolean) => {
    try {
      const res = await apiClient.patch(`/assistant-profiles/${id}`, { isVerified });
      if (res.ok) {
        setAssistants(prev => prev.map(a => a.id === id ? { ...a, isVerified } : a));
      }
    } catch (err) {
      console.error("Failed to update assistant profile:", err);
    }
    setViewingAssistant(null);
  };

  const handleCreateAssistant = async () => {
    setCreateLoading(true);
    try {
      const res = await apiClient.post("/assistant-profiles", createForm);
      if (res.ok) {
        setIsCreateOpen(false);
        setCreateForm({ fullName: "", supportArea: "OTHER", medicalDesc: "", medicalCertUrl: "" });
        fetchAssistants();
      }
    } catch (err) {
      console.error("Failed to create assistant profile:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  const columns: ColumnDef<AssistantProfile>[] = [
    {
      key: "fullName",
      title: language === "vi" ? "Tên người hỗ trợ" : "Assistant Name",
      sortable: true,
      render: (item) => (
        item.userId ? (
          <UserHoverCard userId={item.userId!} language={language}>
            <span className="font-semibold text-slate-800 dark:text-white">{item.fullName}</span>
          </UserHoverCard>
        ) : (
          <span className="font-semibold text-slate-800 dark:text-white">{item.fullName}</span>
        )
      )
    },
    {
      key: "athleteName",
      title: language === "vi" ? "Hỗ trợ cho VĐV" : "Assists Athlete",
      sortable: true,
      render: (item) => (
        item.athleteId ? (
          <UserHoverCard userId={item.athleteId!} language={language}>
            <span className="text-blue-600 font-medium">{item.athleteName}</span>
          </UserHoverCard>
        ) : (
          <span className="text-blue-600 font-medium">{item.athleteName}</span>
        )
      )
    },
    {
      key: "supportArea",
      title: language === "vi" ? "Lĩnh vực" : "Area",
      sortable: true,
      render: (item) => (
        <span className="text-slate-600 dark:text-slate-400">
          {SUPPORT_AREA_LABELS[language]?.[item.supportArea] || item.supportArea}
        </span>
      )
    },
    {
      key: "isVerified",
      title: language === "vi" ? "Trạng thái" : "Status",
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          item.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {item.isVerified
            ? (language === "vi" ? "Đã duyệt" : "Approved")
            : (language === "vi" ? "Chờ duyệt" : "Pending")}
        </span>
      )
    },
    {
      key: "actions",
      title: language === "vi" ? "Thao tác" : "Actions",
      render: (item) => (
        <Button variant="ghost" size="sm" onClick={() => setViewingAssistant(item)}>
          <Eye size={16} />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DataTable
        data={assistants}
        columns={columns}
        totalRecords={totalRecords}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={language === "vi" ? "Tìm theo tên..." : "Search by name..."}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        onCreate={() => setIsCreateOpen(true)}
        createLabel={language === "vi" ? "Thêm hồ sơ" : "Add Profile"}
        isLoading={loading}
      />

      <Dialog open={viewingAssistant !== null} onOpenChange={(open: boolean) => !open && setViewingAssistant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Chi tiết Hồ sơ" : "Profile Details"}</DialogTitle>
          </DialogHeader>
          {viewingAssistant && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Tên người hỗ trợ" : "Name"}</span>
                  <p className="font-semibold">{viewingAssistant.fullName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Lĩnh vực" : "Area"}</span>
                  <p className="font-semibold">{SUPPORT_AREA_LABELS[language]?.[viewingAssistant.supportArea] || viewingAssistant.supportArea}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{language === "vi" ? "Hỗ trợ cho VĐV" : "Assists"}</span>
                <p className="font-semibold text-blue-600">{viewingAssistant.athleteName}</p>
              </div>
              {viewingAssistant.medicalDesc && (
                <div>
                  <span className="text-xs text-slate-500 block">{language === "vi" ? "Mô tả y tế" : "Medical Description"}</span>
                  <p className="text-sm">{viewingAssistant.medicalDesc}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500 block mb-1">{language === "vi" ? "Chứng nhận y khoa / Bằng cấp" : "Medical Certificate"}</span>
                {viewingAssistant.medicalCertUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200">
                    <FileText size={20} className="text-blue-500" />
                    <a href={viewingAssistant.medicalCertUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                      {language === "vi" ? "Xem chứng nhận" : "View Certificate"}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    {language === "vi" ? "Không có chứng nhận đính kèm." : "No certificate attached."}
                  </p>
                )}
              </div>
              <div className="pt-4 flex gap-2">
                {!viewingAssistant.isVerified ? (
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(viewingAssistant.id, true)}>
                    <CheckCircle size={16} className="mr-2" />
                    {language === "vi" ? "Duyệt" : "Approve"}
                  </Button>
                ) : (
                  <Button className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={() => handleUpdateStatus(viewingAssistant.id, false)}>
                    <XCircle size={16} className="mr-2" />
                    {language === "vi" ? "Hủy duyệt" : "Revoke"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Assistant Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Thêm Hồ sơ Người hỗ trợ" : "Add Assistant Profile"}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">{language === "vi" ? "Tên người hỗ trợ" : "Full Name"}</label>
              <input
                type="text"
                value={createForm.fullName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
                placeholder={language === "vi" ? "Nhập tên..." : "Enter name..."}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">{language === "vi" ? "Lĩnh vực hỗ trợ" : "Support Area"}</label>
              <select
                value={createForm.supportArea}
                onChange={(e) => setCreateForm(prev => ({ ...prev, supportArea: e.target.value }))}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
              >
                {Object.entries(SUPPORT_AREA_LABELS[language] || SUPPORT_AREA_LABELS.en).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">{language === "vi" ? "Mô tả y tế" : "Medical Description"}</label>
              <textarea
                value={createForm.medicalDesc}
                onChange={(e) => setCreateForm(prev => ({ ...prev, medicalDesc: e.target.value }))}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">{language === "vi" ? "URL chứng nhận" : "Certificate URL"}</label>
              <input
                type="text"
                value={createForm.medicalCertUrl}
                onChange={(e) => setCreateForm(prev => ({ ...prev, medicalCertUrl: e.target.value }))}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {language === "vi" ? "Hủy" : "Cancel"}
            </Button>
            <Button onClick={handleCreateAssistant} isLoading={createLoading} disabled={!createForm.fullName.trim()}>
              {language === "vi" ? "Tạo mới" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

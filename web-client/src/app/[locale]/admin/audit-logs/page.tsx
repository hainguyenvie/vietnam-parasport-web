"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.push("/");
      } else {
        fetchLogs(page, limit);
      }
    }
  }, [status, session, router, page, limit]);

  const fetchLogs = async (currentPage: number, currentLimit: number) => {
    setLoading(true);
    try {
      const res = await apiClient.request(`/users/admin/audits/all?page=${currentPage}&limit=${currentLimit}`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return <div className="p-8 text-center">{language === "vi" ? "Đang kiểm tra quyền truy cập..." : "Checking access..."}</div>;
  }

  // Frontend search and sort
  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      (log.user?.fullName || "Hệ thống").toLowerCase().includes(q) ||
      (log.user?.email || "").toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      (log.ipAddress || "").toLowerCase().includes(q)
    );
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aVal = a[sortConfig.key] || "";
    let bVal = b[sortConfig.key] || "";

    if (sortConfig.key === "user") {
      aVal = a.user?.fullName || "Hệ thống";
      bVal = b.user?.fullName || "Hệ thống";
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <DataTable
        data={sortedLogs}
        columns={[
          {
            key: "createdAt",
            title: language === "vi" ? "Thời gian" : "Time",
            sortable: true,
            render: (log) => (
              <span className="text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
                {log.createdAt ? new Date(log.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "—"}
              </span>
            )
          },
          {
            key: "user",
            title: language === "vi" ? "Người dùng" : "User",
            sortable: true,
            render: (log) => (
              <span className="text-sm font-medium text-slate-800 dark:text-white">
                {log.user ? (
                  <div className="flex flex-col">
                    <span>{log.user.fullName}</span>
                    <span className="text-[10px] text-slate-500">{log.user.email}</span>
                  </div>
                ) : (
                  language === "vi" ? "Hệ thống" : "System"
                )}
              </span>
            )
          },
          {
            key: "action",
            title: language === "vi" ? "Hành động" : "Action",
            sortable: true,
            render: (log) => {
              const actionMap: Record<string, string> = {
                "POST_SETTINGS": language === "vi" ? "Cập nhật cài đặt" : "Update Settings",
                "LOGIN": language === "vi" ? "Đăng nhập" : "Login",
                "LOGOUT": language === "vi" ? "Đăng xuất" : "Logout",
                "CREATE_USER": language === "vi" ? "Tạo người dùng" : "Create User",
                "UPDATE_USER": language === "vi" ? "Cập nhật người dùng" : "Update User",
                "DELETE_USER": language === "vi" ? "Xóa người dùng" : "Delete User",
                "CREATE_POST": language === "vi" ? "Tạo tin tức" : "Create Post",
                "UPDATE_POST": language === "vi" ? "Cập nhật tin tức" : "Update Post",
                "DELETE_POST": language === "vi" ? "Xóa tin tức" : "Delete Post",
              };
              const displayAction = actionMap[log.action] || log.action;
              return (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {displayAction}
              </span>
            )}
          },
          {
            key: "entityId",
            title: language === "vi" ? "Đối tượng (Entity ID)" : "Entity ID",
            sortable: true,
            render: (log) => (
              <span className="text-sm font-mono text-slate-500 dark:text-slate-400 text-xs">
                {log.entityId}
              </span>
            )
          },
          {
            key: "details",
            title: language === "vi" ? "IP / Chi tiết" : "IP / Details",
            render: (log) => (
              <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                {log.ipAddress && <div className="font-mono mb-1">IP: {log.ipAddress}</div>}
                <div className="truncate" title={JSON.stringify(log.details)}>{JSON.stringify(log.details)}</div>
              </div>
            )
          }
        ]}
        totalRecords={totalItems}
        page={page}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        searchPlaceholder={language === "vi" ? "Tìm kiếm nhật ký..." : "Search logs..."}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={loading}
      />
    </div>
  );
}

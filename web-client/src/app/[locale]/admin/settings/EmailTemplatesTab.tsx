"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Edit, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  content: string;
  variables: string;
  updatedAt: string;
}

export function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortKey(undefined); setSortDirection(null); }
      else setSortDirection("asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await apiClient.get<EmailTemplate[]>("/email-templates");
        if (response.ok) {
          setTemplates(await response.json());
        } else {
          setError("Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn.");
        }
      } catch (err) {
        setError("Không thể tải danh sách email template.");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const processed = useMemo(() => {
    let data = templates;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.key.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
      );
    }
    if (sortKey && sortDirection) {
      data = [...data].sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp =
          typeof aVal === "string"
            ? aVal.localeCompare(bVal)
            : aVal < bVal
              ? -1
              : aVal > bVal
                ? 1
                : 0;
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [templates, search, sortKey, sortDirection]);

  const columns: ColumnDef<EmailTemplate>[] = [
    {
      key: "key",
      title: "Key",
      sortable: true,
      render: (t) => (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
          {t.key}
        </span>
      ),
    },
    {
      key: "subject",
      title: "Subject",
      render: (t) => (
        <span className="font-semibold text-sm text-slate-900 dark:text-white">
          {t.subject}
        </span>
      ),
    },
    {
      key: "updatedAt",
      title: "Updated",
      sortable: true,
      render: (t) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(t.updatedAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (t) => (
        <Link
          href={`/admin/email-templates/${t.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-800 dark:bg-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-xl transition cursor-pointer"
        >
          <Edit size={14} />
          Chỉnh sửa
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={36} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      ) : (
        <DataTable
          data={processed}
          columns={columns}
          totalRecords={processed.length}
          page={1}
          pageSize={processed.length}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchPlaceholder="Tìm kiếm email template..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      )}
    </>
  );
}

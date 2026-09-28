"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import DOMPurify from 'isomorphic-dompurify';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from '@/hooks/useTranslation';
import { DataTable } from "@/components/ui/DataTable";
import { Loader2, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor').then(m => m.TiptapEditor), { ssr: false, loading: () => <div className="h-20 bg-gray-100 animate-pulse rounded-md"></div> });

export default function SportClassificationsTab({ sportId }: { sportId: string }) {
  const { data: session } = useSession();
  const { language } = useLanguage();
  
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassification, setEditingClassification] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    medicalDesc: "",
    disabilityCriteria: "",
    minAge: "",
    maxAge: "",
    genderRules: "ANY",
    requiresAssistant: false
  });
  const [formLoading, setFormLoading] = useState(false);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Table tools
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  useEffect(() => {
    fetchClassifications();
  }, [sportId]);

  const fetchClassifications = async () => {
    try {
      const res = await apiClient.request(`/sport-classifications?sportId=${sportId}`);
      if (res.ok) {
        const data = await res.json();
        setClassifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key, direction });
  };

  const openAddModal = () => {
    setEditingClassification(null);
    setFormData({ code: "", description: "", medicalDesc: "", disabilityCriteria: "", minAge: "", maxAge: "", genderRules: "ANY", requiresAssistant: false });
    setIsModalOpen(true);
  };

  const openEditModal = (cls: any) => {
    setEditingClassification(cls);
    setFormData({
      code: cls.code,
      description: cls.description || "",
      medicalDesc: cls.medicalDesc || "",
      disabilityCriteria: cls.disabilityCriteria || "",
      minAge: cls.minAge || "",
      maxAge: cls.maxAge || "",
      genderRules: cls.genderRules || "ANY",
      requiresAssistant: cls.requiresAssistant || false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const isEdit = !!editingClassification;
    const url = isEdit 
      ? getApiUrl(`/sport-classifications/${editingClassification.id}`) 
      : getApiUrl("/sport-classifications");
    const method = isEdit ? "PUT" : "POST";

    const payload = { ...formData, sportId };

    try {
      const token = (session as any)?.accessToken;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchClassifications();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      const token = (session as any)?.accessToken;
      const res = await apiClient.request(`/sport-classifications/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchClassifications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  const filteredClassifications = classifications.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedClassifications = [...filteredClassifications].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
    if (sortConfig.direction === "asc") return aVal.toString().localeCompare(bVal.toString());
    return bVal.toString().localeCompare(aVal.toString());
  });

  const currentClassifications = sortedClassifications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div>
      <DataTable
        data={currentClassifications}
        columns={[
          { key: "code", title: language === "vi" ? "Mã hạng thương tật" : "Classification Code", sortable: true, render: (c) => <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{c.code}</span> },
          { key: "description", title: language === "vi" ? "Mô tả" : "Description", render: (c) => <div className="text-sm text-slate-600 max-w-lg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.description || "-") }} /> },
          {
            key: "actions",
            title: language === "vi" ? "Thao tác" : "Actions",
            render: (cls) => (
              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEditModal(cls)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                <button onClick={() => setDeleteId(cls.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            )
          }
        ]}
        totalRecords={sortedClassifications.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCreate={openAddModal}
        createLabel={language === "vi" ? "Thêm hạng thương tật" : "Add Classification"}
        onRowClick={(e, row) => openEditModal(row)}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClassification ? (language === "vi" ? "Sửa hạng thương tật" : "Edit Classification") : (language === "vi" ? "Thêm hạng thương tật" : "Add Classification")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Mã hạng (Code)" : "Code"} *</label>
                <Input required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="VD: T11, F20..." className="font-mono uppercase" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Yêu cầu giới tính" : "Gender Rules"}</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.genderRules} 
                  onChange={(e) => setFormData({...formData, genderRules: e.target.value})}
                >
                  <option value="ANY">{language === "vi" ? "Tất cả" : "Any"}</option>
                  <option value="MALE_ONLY">{language === "vi" ? "Chỉ Nam" : "Male Only"}</option>
                  <option value="FEMALE_ONLY">{language === "vi" ? "Chỉ Nữ" : "Female Only"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Độ tuổi tối thiểu" : "Min Age"}</label>
                <Input type="number" value={formData.minAge} onChange={(e) => setFormData({...formData, minAge: e.target.value})} placeholder="VD: 16" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Độ tuổi tối đa" : "Max Age"}</label>
                <Input type="number" value={formData.maxAge} onChange={(e) => setFormData({...formData, maxAge: e.target.value})} placeholder="VD: 50" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="requiresAssistant" checked={formData.requiresAssistant} onChange={(e) => setFormData({...formData, requiresAssistant: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <label htmlFor="requiresAssistant" className="text-sm font-semibold">{language === "vi" ? "Bắt buộc có người hỗ trợ (Assistant)" : "Requires Assistant"}</label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Tiêu chí thương tật" : "Disability Criteria"}</label>
              <textarea 
                className="w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows={3} 
                value={formData.disabilityCriteria} 
                onChange={(e) => setFormData({...formData, disabilityCriteria: e.target.value})}
                placeholder={language === "vi" ? "Nhập tiêu chí y khoa cụ thể..." : "Specific medical criteria..."}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Mô tả y khoa" : "Medical Description"}</label>
              <textarea 
                className="w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows={3} 
                value={formData.medicalDesc} 
                onChange={(e) => setFormData({...formData, medicalDesc: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Mô tả chung" : "Description"}</label>
              <TiptapEditor value={formData.description} onChange={(val) => setFormData({...formData, description: val})} />
            </div>
            <DialogFooter className="px-0 pb-0 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{language === "vi" ? "Hủy" : "Cancel"}</Button>
              <Button type="submit" isLoading={formLoading}>{language === "vi" ? "Lưu" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa hạng thương tật này?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        isLoading={actionLoading !== null}
      />
    </div>
  );
}

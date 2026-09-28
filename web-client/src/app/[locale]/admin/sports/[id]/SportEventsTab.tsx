"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from '@/hooks/useTranslation';
import { DataTable } from "@/components/ui/DataTable";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function SportEventsTab({ sportId }: { sportId: string }) {
  const { data: session } = useSession();
  const { language } = useLanguage();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "MALE",
    teamSize: 1,
    unit: ""
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
    fetchEvents();
  }, [sportId]);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.request(`/sport-events?sportId=${sportId}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
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
    setEditingEvent(null);
    setFormData({ name: "", gender: "MALE", teamSize: 1, unit: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      gender: event.gender,
      teamSize: event.teamSize || 1,
      unit: event.unit || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const isEdit = !!editingEvent;
    const url = isEdit 
      ? getApiUrl(`/sport-events/${editingEvent.id}`) 
      : getApiUrl("/sport-events");
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...formData,
      sportId,
      teamSize: parseInt(formData.teamSize.toString())
    };

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
        fetchEvents();
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
      const res = await apiClient.request(`/sport-events/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  const filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
    if (sortConfig.direction === "asc") return aVal.toString().localeCompare(bVal.toString());
    return bVal.toString().localeCompare(aVal.toString());
  });

  const currentEvents = sortedEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div>
      <DataTable
        data={currentEvents}
        columns={[
          { key: "name", title: language === "vi" ? "Tên nội dung" : "Event Name", sortable: true },
          { key: "gender", title: language === "vi" ? "Giới tính" : "Gender", sortable: true, render: (e) => e.gender === "MALE" ? "Nam" : e.gender === "FEMALE" ? "Nữ" : "Hỗn hợp" },
          { key: "teamSize", title: language === "vi" ? "Số người" : "Team Size", sortable: true },
          { key: "unit", title: language === "vi" ? "Đơn vị đo" : "Unit", render: (e) => e.unit || "-" },
          {
            key: "actions",
            title: language === "vi" ? "Thao tác" : "Actions",
            render: (event) => (
              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEditModal(event)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                <button onClick={() => setDeleteId(event.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            )
          }
        ]}
        totalRecords={sortedEvents.length}
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
        createLabel={language === "vi" ? "Thêm nội dung" : "Add Event"}
        onRowClick={(e, row) => openEditModal(row)}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? (language === "vi" ? "Sửa nội dung" : "Edit Event") : (language === "vi" ? "Thêm nội dung" : "Add Event")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Tên nội dung" : "Event Name"} *</label>
              <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="VD: Chạy 100m, Nhảy xa..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Giới tính" : "Gender"}</label>
                <select 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="MIXED">Hỗn hợp</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Số người/Đội" : "Team Size"}</label>
                <Input type="number" min={1} required value={formData.teamSize} onChange={(e) => setFormData({...formData, teamSize: parseInt(e.target.value) || 1})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Đơn vị đo (giây, mét...)" : "Unit"}</label>
              <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="VD: s, m, kg" />
            </div>
            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="submit" isLoading={formLoading}>Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nội dung thi này?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        isLoading={actionLoading !== null}
      />
    </div>
  );
}

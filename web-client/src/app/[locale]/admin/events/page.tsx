"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Search, Loader2, Calendar } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useLanguage } from '@/hooks/useTranslation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const eventSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Thời gian bắt đầu không được để trống"),
  endDate: z.string().min(1, "Thời gian kết thúc không được để trống"),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).default("UPCOMING"),
  isPublished: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
      status: "UPCOMING",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.request("/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    setActionLoading("save");

    try {
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing ? getApiUrl(`/events/${editId}`) : getApiUrl("/events");
      
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEditing ? "Cập nhật sự kiện thành công" : "Tạo sự kiện thành công");
        await fetchEvents();
        closeModal();
      } else {
        toast.error("Có lỗi xảy ra khi lưu sự kiện");
      }
    } catch (error) {
      toast.error("Không thể kết nối đến server");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      const res = await apiClient.request(`/events/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setEvents(events.filter(e => e.id !== deleteId));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  const openEditModal = (event: any) => {
    setIsEditing(true);
    setEditId(event.id);
    setValue("title", event.title || "");
    setValue("description", event.description || "");
    setValue("location", event.location || "");
    setValue("startDate", event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "");
    setValue("endDate", event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "");
    setValue("status", event.status || "UPCOMING");
    setValue("isPublished", event.isPublished || false);
  };

  const closeModal = () => {
    setIsEditing(false);
    setEditId(null);
    reset();
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key, direction });
  };

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedEvents = sortedEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: ColumnDef<any>[] = [
    { key: "title", title: "Tên sự kiện", sortable: true },
    { key: "location", title: "Địa điểm", sortable: true },
    { 
      key: "startDate", 
      title: "Thời gian", 
      sortable: true,
      render: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : "—"
    },
    { 
      key: "status", 
      title: "Trạng thái", 
      sortable: true,
      render: (row) => {
        const statusMap: Record<string, string> = {
          "UPCOMING": language === "vi" ? "SẮP DIỄN RA" : "UPCOMING",
          "ONGOING": language === "vi" ? "ĐANG DIỄN RA" : "ONGOING",
          "COMPLETED": language === "vi" ? "ĐÃ KẾT THÚC" : "COMPLETED",
          "CANCELLED": language === "vi" ? "ĐÃ HỦY" : "CANCELLED",
        };
        return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'UPCOMING' ? 'bg-blue-100 text-blue-600' : row.status === 'ONGOING' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
          {statusMap[row.status] || row.status}
        </span>
      )}
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEditModal(row)} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
          <button onClick={() => setDeleteId(row.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <DataTable
        data={paginatedEvents}
        columns={columns}
        totalRecords={filteredEvents.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        searchPlaceholder="Tìm kiếm sự kiện, địa điểm..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCreate={() => {
          reset();
          setEditId(null);
          setIsEditing(true);
        }}
        createLabel="Thêm sự kiện"
        isLoading={loading}
      />

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Sửa sự kiện" : "Thêm sự kiện"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Tên sự kiện *</label>
              <Input {...register("title")} type="text" />
              {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Mô tả ngắn</label>
              <Textarea {...register("description")} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Ngày bắt đầu *</label>
                <Input {...register("startDate")} type="datetime-local" />
                {errors.startDate && <span className="text-red-500 text-sm">{errors.startDate.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Ngày kết thúc</label>
                <Input {...register("endDate")} type="datetime-local" />
                {errors.endDate && <span className="text-red-500 text-sm">{errors.endDate.message}</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Địa điểm</label>
              <Input {...register("location")} type="text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Trạng thái</label>
                <Select value={watch("status")} onValueChange={(value: string) => setValue("status", value as any, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">{language === "vi" ? "Sắp diễn ra" : "Upcoming"}</SelectItem>
                    <SelectItem value="ONGOING">{language === "vi" ? "Đang diễn ra" : "Ongoing"}</SelectItem>
                    <SelectItem value="COMPLETED">{language === "vi" ? "Đã kết thúc" : "Completed"}</SelectItem>
                    <SelectItem value="CANCELLED">{language === "vi" ? "Đã hủy" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Checkbox
                  id="isPublished"
                  checked={watch("isPublished")}
                  onCheckedChange={(checked: boolean) => setValue("isPublished", !!checked, { shouldValidate: true })}
                />
                <Label htmlFor="isPublished">Công khai (Hiển thị)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Hủy</Button>
              <Button type="submit" disabled={!!actionLoading}>Lưu sự kiện</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa sự kiện này?"
        confirmText="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        isLoading={!!actionLoading}
      />
    </div>
  );
}

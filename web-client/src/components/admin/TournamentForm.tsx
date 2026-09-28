"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface TournamentFormProps {
   
  initialData?: any;
   
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TournamentForm({ initialData, onSubmit, onCancel, isSubmitting }: TournamentFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    location: initialData?.location || "",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : new Date(new Date().getTime() + 86400000)  .toISOString().split('T')[0],
    status: initialData?.status || "UPCOMING",
    participantType: initialData?.participantType || "INDIVIDUAL",
    holdThirdPlaceMatch: !!initialData?.holdThirdPlaceMatch
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tên Giải đấu <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          required
          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a').replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e').replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i').replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o').replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u').replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y').replace(/đ/gi, 'd').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')})}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug</label>
        <input 
          type="text" 
          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
          value={formData.slug}
          onChange={e => setFormData({...formData, slug: e.target.value})}
          placeholder="De trong de tu dong tao"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Địa điểm <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          required
          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
          value={formData.location}
          onChange={e => setFormData({...formData, location: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
          <input 
            type="date" 
            required
            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
            value={formData.startDate}
            onChange={e => setFormData({...formData, startDate: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
          <input 
            type="date" 
            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
            value={formData.endDate}
            onChange={e => setFormData({...formData, endDate: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <select 
            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="ONGOING">Đang diễn ra</option>
            <option value="COMPLETED">Đã kết thúc</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hình thức</label>
          <select 
            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
            value={formData.participantType}
            onChange={e => setFormData({...formData, participantType: e.target.value})}
          >
            <option value="INDIVIDUAL">Cá nhân (1-1)</option>
            <option value="TEAM">Đồng đội (Theo Đội)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            checked={formData.holdThirdPlaceMatch}
            onChange={e => setFormData({...formData, holdThirdPlaceMatch: e.target.checked})}
          />
          <span className="text-sm font-medium">Tổ chức trận Tranh Hạng 3</span>
        </label>
        <p className="text-xs text-slate-500 mt-1 ml-6">Hệ thống sẽ tự động sinh thêm trận đấu giữa 2 người thua ở Bán kết.</p>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          {initialData ? "Lưu lại" : "Tạo giải đấu"}
        </Button>
      </div>
    </form>
  );
}

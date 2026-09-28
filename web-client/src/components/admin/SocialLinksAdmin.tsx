"use client";

import { getApiUrl } from "@/utils/api";

import DOMPurify from 'isomorphic-dompurify';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Edit, Trash2, Save, GripVertical, CheckCircle2, XCircle } from "lucide-react";
import * as AllIcons from "lucide-react";
import { toast } from "sonner";

interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  isActive: boolean;
  order: number;
}

export function SocialLinksAdmin() {
  const { data: session } = useSession();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    icon: "",
    isActive: true,
    order: 0,
  });

  const apiUrl = getApiUrl('/');

  const fetchLinks = async () => {
    try {
      const res = await fetch(`${apiUrl}/social-links`);
      if (res.ok) {
        const envelope = await res.json();
        setLinks(envelope?.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách mạng xã hội.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleOpenModal = (link?: SocialLink) => {
    if (link) {
      setEditingId(link.id);
      setFormData({
        name: link.name,
        url: link.url,
        icon: link.icon,
        isActive: link.isActive,
        order: link.order,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        url: "",
        icon: "",
        isActive: true,
        order: links.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId ? `${apiUrl}/social-links/${editingId}` : `${apiUrl}/social-links`;
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");
        fetchLinks();
        handleCloseModal();
      } else {
        toast.error("Có lỗi xảy ra khi lưu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa link này?")) return;
    try {
      const res = await fetch(`${apiUrl}/social-links/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (res.ok) {
        toast.success("Xóa thành công!");
        fetchLinks();
      } else {
        toast.error("Có lỗi xảy ra khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const toggleActive = async (link: SocialLink) => {
    try {
      const res = await fetch(`${apiUrl}/social-links/${link.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (res.ok) {
        fetchLinks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Mạng xã hội (Footer)</h2>
          <p className="text-sm text-slate-500">Quản lý các liên kết mạng xã hội hiển thị ở chân trang.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
              <th className="pb-3 font-medium px-4">Tên</th>
              <th className="pb-3 font-medium px-4">Icon (Lucide)</th>
              <th className="pb-3 font-medium px-4">URL</th>
              <th className="pb-3 font-medium px-4">Hiển thị</th>
              <th className="pb-3 font-medium px-4">Thứ tự</th>
              <th className="pb-3 font-medium px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{link.name}</td>
                <td className="py-3 px-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    {link.icon.trim().startsWith('<svg') ? (
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.icon.trim(), { USE_PROFILES: { svg: true } }) }} className="w-4 h-4 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" />
                    ) : (
                      <AllIcons.HelpCircle size={16} />
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm truncate max-w-[200px]">{link.url}</td>
                <td className="py-3 px-4">
                  <button onClick={() => toggleActive(link)}>
                    {link.isActive ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-slate-400" size={20} />}
                  </button>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{link.order}</td>
                <td className="py-3 px-4 flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(link)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(link.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">Chưa có liên kết nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? "Cập nhật Mạng xã hội" : "Thêm Mạng xã hội"}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên mạng xã hội (VD: Facebook)</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Đường dẫn URL</label>
                <input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mã SVG của Icon</label>
                <div className="flex gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 w-12 h-12 border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-600 dark:text-slate-400">
                    {formData.icon.trim().startsWith('<svg') ? (
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.icon.trim(), { USE_PROFILES: { svg: true } }) }} className="w-6 h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" />
                    ) : (
                      <AllIcons.HelpCircle size={20} className="text-slate-400" />
                    )}
                  </div>
                  <textarea 
                    required 
                    value={formData.icon} 
                    onChange={e => setFormData({...formData, icon: e.target.value})} 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] font-mono text-xs" 
                    placeholder="Paste mã <svg>...</svg> của bạn vào đây..." 
                    rows={4}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">Hoặc chọn từ Lucide:</span>
                  {["Globe", "Mail", "Phone", "MessageCircle", "Link", "MapPin"].map(i => {
                    const PreviewIcon = (AllIcons as any)[i] || AllIcons.HelpCircle;
                    return (
                      <button 
                        key={i} 
                        type="button" 
                        onClick={async () => {
                          const { renderToStaticMarkup } = await import('react-dom/server');
                          const svgString = renderToStaticMarkup(<PreviewIcon size={24} />);
                          setFormData({...formData, icon: svgString});
                        }} 
                        className={`p-2 border rounded-md transition flex items-center justify-center bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700`}
                        title={i}
                      >
                        <PreviewIcon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Thứ tự hiển thị</label>
                  <input type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Trạng thái</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Hiển thị</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

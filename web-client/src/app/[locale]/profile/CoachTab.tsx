"use client";

import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { Loader2, Award, ShieldCheck, Save, MessageCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CoachTab({ userProfile, onRefresh }: { userProfile: any; onRefresh: () => void }) {
  const { data: session } = useSession();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [sports, setSports] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sportId: userProfile?.coachProfile?.sportId || "",
    experienceYears: userProfile?.coachProfile?.experienceYears || 0,
    specialty: userProfile?.coachProfile?.specialty || "",
    certificateUrl: userProfile?.coachProfile?.certificateUrl || "",
    facebookUrl: userProfile?.coachProfile?.facebookUrl || "",
    zaloUrl: userProfile?.coachProfile?.zaloUrl || "",
    tiktokUrl: userProfile?.coachProfile?.tiktokUrl || "",
  });

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const res = await apiClient.request("/sports");
      if (res.ok) {
        setSports(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.request(`/users/${userProfile.id}/coach-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(language === "vi" ? "Cập nhật hồ sơ HLV thành công!" : "Coach profile updated successfully!");
        onRefresh();
      } else {
        toast.error(language === "vi" ? "Cập nhật thất bại" : "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b dark:border-slate-800 pb-3 mb-6 gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Award size={20} className="text-indigo-500" />
            {language === "vi" ? "Thông tin Chuyên môn Huấn luyện viên" : "Coach Professional Profile"}
          </h2>
          {userProfile?.coachProfile?.isVerified ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/20">
              <ShieldCheck size={14} />
              {language === "vi" ? "Đã Xác Minh Chuyên Môn" : "Verified Coach"}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/20">
              <Loader2 size={14} className="animate-spin" />
              {language === "vi" ? "Đang Chờ Phê Duyệt" : "Verification Pending"}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === "vi" ? "Bộ môn huấn luyện" : "Sport / Discipline"}
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={form.sportId}
                onChange={(e) => setForm({ ...form, sportId: e.target.value })}
                required
              >
                <option value="">-- {language === "vi" ? "Chọn Bộ Môn" : "Select Sport"} --</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === "vi" ? "Số năm kinh nghiệm" : "Years of Experience"}
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-200/60 dark:border-slate-800 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === "vi" ? "Chuyên ngành / Lĩnh vực chuyên sâu" : "Specialty / Areas of Expertise"}
              </label>
              <input
                type="text"
                placeholder={language === "vi" ? "Ví dụ: Điền kinh xe lăn, Kỹ năng bơi lội cơ bản cho người khuyết tật..." : "Example: Wheelchair racing, swimming biomechanics..."}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === "vi" ? "Liên kết Bằng cấp / Chứng chỉ huấn luyện (URL)" : "Coaching Certificate / Credentials Link (URL)"}
              </label>
              <input
                type="url"
                placeholder="https://example.com/my-certificate.pdf"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={form.certificateUrl}
                onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })}
              />
              <p className="text-[10px] text-slate-400">
                {language === "vi" 
                  ? "* Vui lòng tải chứng chỉ lên Google Drive/Dropbox và dán liên kết công khai để ban quản trị đối chiếu phê duyệt."
                  : "* Please upload your credential file to Google Drive/Dropbox and paste the public link here for verification."}
              </p>
            </div>
          </div>

          <div className="border-t dark:border-slate-800 pt-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              {language === "vi" ? "Mạng xã hội" : "Social Links"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                  Facebook URL
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/username"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.facebookUrl}
                  onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-blue-500" /> Zalo Phone / Nickname Link
                </label>
                <input
                  type="text"
                  placeholder="https://zalo.me/phone"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.zaloUrl}
                  onChange={(e) => setForm({ ...form, zaloUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-800 dark:text-white shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.62 4.2 1.22 1.25 2.87 2 4.62 2 .01 1.27.01 2.54 0 3.81-.88-.01-1.77-.21-2.58-.57a7.86 7.86 0 01-3.66-3.15c-.02 1.8-.01 3.61-.02 5.41-.07 3.32-1.95 6.44-5.02 7.7-2.9 1.29-6.52.88-9-1.03A7.47 7.47 0 01.32 12.7c-.2-3.11 1.27-6.22 3.9-7.85 2.18-1.4 4.95-1.71 7.37-.87.01 1.34.02 2.68.02 4.02-1.28-.48-2.73-.39-3.93.28-1.32.72-2.18 2.15-2.22 3.67-.08 2.05 1.4 3.93 3.43 4.23 2.07.36 4.19-.88 4.77-2.88.24-.72.26-1.5.25-2.25-.02-3.7-.01-7.4-.02-11.1z"/></svg>
                  TikTok URL
                </label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@username"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.tiktokUrl}
                  onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={saving} className="gap-2 px-6">
              {!saving && <Save size={16} />}
              {language === "vi" ? "Lưu hồ sơ huấn luyện" : "Save Coach Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

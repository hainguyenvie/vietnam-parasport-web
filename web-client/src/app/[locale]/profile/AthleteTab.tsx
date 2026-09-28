"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from '@/hooks/useTranslation';
import { toast } from "sonner";
import { Loader2, Medal, UserCheck, ShieldCheck, Plus, Upload, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AthleteTab({ userProfile }: { userProfile: any }) {
  const { data: session } = useSession();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [achClassifications, setAchClassifications] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Profile Form State
  const [form, setForm] = useState({
    organizationId: userProfile?.athleteProfile?.organizationId || "",
    classificationId: userProfile?.athleteProfile?.classificationId || ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Achievement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [achForm, setAchForm] = useState({
    tournamentId: "",
    eventId: "",
    classificationId: "",
    medal: "",
    result: ""
  });
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [savingAch, setSavingAch] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  // Fetch classifications for achievement form based on selected event's sport
  useEffect(() => {
    if (!achForm.eventId || !isModalOpen) {
      setAchClassifications([]);
      return;
    }
    const selectedEvent = events.find(e => e.id === achForm.eventId);
    if (selectedEvent?.sportId) {
      apiClient.request(`/sport-classifications?sportId=${selectedEvent.sportId}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAchClassifications(Array.isArray(data) ? data : data.data || []))
        .catch(() => setAchClassifications([]));
    } else {
      setAchClassifications([]);
    }
  }, [achForm.eventId, events, isModalOpen]);

  const fetchData = async () => {
    try {
      const [orgRes, clsRes, evtRes, achRes, trnRes] = await Promise.all([
        apiClient.request("/organizations"),
        apiClient.request(`/sport-classifications?sportId=${userProfile.athleteProfile.sportId}`),
        apiClient.request("/sport-events"),
        apiClient.request(`/athlete-achievements?athleteId=${userProfile.athleteProfile?.id}`),
        apiClient.request("/tournaments")
      ]);

      if (orgRes.ok) setOrganizations(await orgRes.json());
      if (clsRes.ok) setClassifications(await clsRes.json());
      if (evtRes.ok) setEvents(await evtRes.json());
      if (achRes.ok) setAchievements(await achRes.json());
      if (trnRes.ok) setTournaments(await trnRes.json());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiClient.request(`/users/${userProfile.id}/athlete-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({ ...form, profileId: userProfile.athleteProfile.id })
      });
      if (res.ok) {
        toast.success(language === "vi" ? "Cập nhật thành công!" : "Updated successfully!");
      } else {
        toast.error(language === "vi" ? "Cập nhật thất bại" : "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAch(true);
    try {
      const res = await apiClient.request(`/athlete-achievements/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({
          ...achForm,
          athleteId: userProfile.athleteProfile.id
        })
      });
      if (res.ok) {
        toast.success(language === "vi" ? "Đã gửi thành tích (Chờ duyệt)!" : "Achievement submitted (Pending verification)!");
        setIsModalOpen(false);
        fetchData(); // Reload achievements
      } else {
        toast.error("Failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error");
    } finally {
      setSavingAch(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  if (!userProfile?.athleteProfile) {
    return (
      <div className="p-8 text-center text-slate-500">
        {language === "vi" ? "Không tìm thấy hồ sơ VĐV." : "Athlete profile not found."}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Profile Settings */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-md">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-3">
          <UserCheck size={20} className="text-blue-500" /> 
          {language === "vi" ? "Thông tin Vận động viên" : "Athlete Information"}
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                {language === "vi" ? "Đơn vị / CLB" : "Organization / Club"}
              </label>
              <select 
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                value={form.organizationId}
                onChange={(e) => setForm({...form, organizationId: e.target.value})}
              >
                <option value="">-- {language === "vi" ? "Chọn Đơn vị" : "Select Organization"} --</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                {language === "vi" ? "Hạng thương tật" : "Classification"}
              </label>
              <select 
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                value={form.classificationId}
                onChange={(e) => setForm({...form, classificationId: e.target.value})}
              >
                <option value="">-- {language === "vi" ? "Chọn Hạng" : "Select Classification"} --</option>
                {classifications.map(c => (
                  <option key={c.id} value={c.id}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" isLoading={savingProfile}>{language === "vi" ? "Lưu thông tin" : "Save Changes"}</Button>
        </form>
      </div>

      {/* Achievements */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-md">
        <div className="flex items-center justify-between border-b pb-3 mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Medal size={20} className="text-yellow-500" /> 
            {language === "vi" ? "Thành tích thi đấu" : "Achievements"}
          </h2>
          <Button onClick={() => {
            setAchForm({ tournamentId: "", eventId: "", classificationId: "", medal: "", result: "" });
            setIsModalOpen(true);
          }} variant="outline" size="sm" className="gap-2">
            <Plus size={16} /> {language === "vi" ? "Thêm" : "Add"}
          </Button>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            {language === "vi" ? "Chưa có thành tích nào được ghi nhận." : "No achievements recorded."}
          </div>
        ) : (
          <div className="space-y-4">
            {achievements.map(ach => (
              <div key={ach.id} className="p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-bold">{ach.tournament?.nameVi || ach.tournament?.nameEn || "Giải đấu"}</div>
                  <div className="text-sm text-slate-600">
                    {ach.event?.name} - {ach.classification?.code} {ach.result ? `(${ach.result})` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ach.medal && <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                    ach.medal === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                    ach.medal === 'SILVER' ? 'bg-slate-200 text-slate-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{ach.medal}</span>}
                  
                  {ach.isVerified ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <ShieldCheck size={14} /> {language === "vi" ? "Đã xác thực" : "Verified"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      <Loader2 size={14} /> {language === "vi" ? "Chờ duyệt" : "Pending"}
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        const res = await apiClient.request(`/athlete-achievements/${ach.id}/feature`, { method: "PUT" });
                        if (res.ok) { fetchData(); }
                      } catch { /* silent */ }
                    }}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${ach.isFeatured ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:text-amber-500'}`}
                    title={ach.isFeatured ? (language === "vi" ? "Bỏ ghim" : "Unpin") : (language === "vi" ? "Ghim lên trang cá nhân" : "Pin to profile")}
                  >
                    <Star size={14} className={ach.isFeatured ? 'fill-amber-500' : ''} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Thêm thành tích (Tự khai báo)" : "Add Achievement"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAchievement} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Giải đấu" : "Tournament"}</label>
              <select className="w-full rounded-md border p-2 text-sm" value={achForm.tournamentId} onChange={e => setAchForm({...achForm, tournamentId: e.target.value})} required>
                <option value="">-- Chọn --</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.nameVi}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Nội dung" : "Event"}</label>
              <select className="w-full rounded-md border p-2 text-sm" value={achForm.eventId} onChange={e => setAchForm({...achForm, eventId: e.target.value, classificationId: ""})} required>
                <option value="">-- Chọn --</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold block">{language === "vi" ? "Hạng thương tật" : "Classification"}</label>
              <select className="w-full rounded-md border p-2 text-sm" value={achForm.classificationId} onChange={e => setAchForm({...achForm, classificationId: e.target.value})}>
                <option value="">-- Chọn --</option>
                {achClassifications.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Huy chương" : "Medal"}</label>
                <select className="w-full rounded-md border p-2 text-sm" value={achForm.medal} onChange={e => setAchForm({...achForm, medal: e.target.value})}>
                  <option value="">-- Không có --</option>
                  <option value="GOLD">Vàng (Gold)</option>
                  <option value="SILVER">Bạc (Silver)</option>
                  <option value="BRONZE">Đồng (Bronze)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">{language === "vi" ? "Kết quả/Thành tích" : "Result"}</label>
                <Input placeholder="VD: 10.5s, 5m" value={achForm.result} onChange={e => setAchForm({...achForm, result: e.target.value})} />
              </div>
            </div>
            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="submit" isLoading={savingAch}>Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

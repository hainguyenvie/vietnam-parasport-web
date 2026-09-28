"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { formatDate } from "@/lib/date-utils";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trophy, Calendar, MapPin, Flag, ChevronRight, Save } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DatePicker } from "@/components/ui/date-picker";
import { MediaUpload } from "@/components/MediaUpload";
import MatchesTab from "./MatchesTab";
import RankingsTab from "./RankingsTab";
import BracketTab from "./BracketTab";
import ParticipantsTab from "./ParticipantsTab";

// next/image available for migration — add unoptimized for dynamic URLs

export default function TournamentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "matches" | "rankings" | "bracket">("overview");

  useEffect(() => {
    if (!id) return;
    apiClient.request(`/tournaments/${id}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data) {
          setTournament({
            ...data,
            startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "",
            endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 10) : ""
          });
        }
      })
      .catch(err => {
        // silently ignore fetch errors to avoid console noise
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.request(`/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tournament.name,
          startDate: new Date(tournament.startDate).toISOString(),
          endDate: new Date(tournament.endDate).toISOString(),
          location: tournament.location,
          status: tournament.status,
          bannerUrl: tournament.bannerUrl
        })
      });
      if (res.ok) {
        toast.success("Cập nhật thông tin thành công!");
      } else {
        toast.error("Lỗi khi cập nhật");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (!tournament) return (
    <div className="text-center p-20 space-y-4">
      <div className="text-rose-500 font-semibold text-lg">Không tìm thấy giải đấu</div>
      <p className="text-slate-500 text-sm">Giải đấu có thể đã bị xóa do hệ thống vừa được thiết lập lại.</p>
      <Link href="/admin/tournaments" className="text-blue-600 hover:underline">Quay lại danh sách Giải đấu</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/tournaments">Quay lại</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight size={14} />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate max-w-xs">{tournament.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
            {tournament.bannerUrl ? (
              <img src={tournament.bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy size={40} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{tournament.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar size={16} /> {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
              <span className="flex items-center gap-1.5"><MapPin size={16} /> {tournament.location || "Chưa cập nhật"}</span>
              <span className="flex items-center gap-1.5"><Flag size={16} /> {tournament.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as typeof activeTab)}>
        <TabsList variant="line" className="gap-0 px-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="participants">Vận động viên</TabsTrigger>
          <TabsTrigger value="matches">Lịch thi đấu</TabsTrigger>
          <TabsTrigger value="bracket">Sơ đồ giải</TabsTrigger>
          <TabsTrigger value="rankings">Bảng xếp hạng</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-4">Thông tin giải đấu</h2>
            <form onSubmit={handleUpdateOverview} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1">Tên giải đấu</label>
                <Input 
                  required 
                  value={tournament.name || ""} 
                  onChange={(e) => setTournament({...tournament, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ảnh đại diện giải đấu</label>
                <MediaUpload
                  value={tournament.bannerUrl || ""}
                  onChange={(url) => setTournament({...tournament, bannerUrl: url})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <DatePicker
                    value={tournament.startDate ? new Date(tournament.startDate) : undefined}
                    onChange={(date) => setTournament({...tournament, startDate: date ? date.toISOString().slice(0, 10) : ""})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <DatePicker
                    value={tournament.endDate ? new Date(tournament.endDate) : undefined}
                    onChange={(date) => setTournament({...tournament, endDate: date ? date.toISOString().slice(0, 10) : ""})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Địa điểm</label>
                  <Input 
                    value={tournament.location || ""} 
                    onChange={(e) => setTournament({...tournament, location: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <Select
                    value={tournament.status || "UPCOMING"}
                    onValueChange={(value: string) => setTournament({...tournament, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
                      <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
                      <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" isLoading={saving} disabled={saving} className="flex items-center gap-2">
                  <Save size={16} /> Lưu thông tin
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <ParticipantsTab tournamentId={id as string} />
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <MatchesTab tournamentId={id as string} />
        </TabsContent>

        <TabsContent value="bracket" className="mt-6">
          <BracketTab tournamentId={id as string} tournament={tournament} />
        </TabsContent>

        <TabsContent value="rankings" className="mt-6">
          <RankingsTab tournamentId={id as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

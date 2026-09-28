"use client";

import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/date-utils";
import { useState, useEffect } from "react";
import { Trophy, MapPin, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useTranslation";
import Link from "next/link";

const t: Record<string, Record<string, string>> = {
  vi: {
    title: "Giải đấu",
    desc: "Danh sách các giải đấu thể thao người khuyết tật.",
    noTournaments: "Chưa có giải đấu nào.",
    viewDetails: "Xem chi tiết",
  },
  en: {
    title: "Tournaments",
    desc: "List of parasports tournaments.",
    noTournaments: "No tournaments yet.",
    viewDetails: "View details",
  },
};

export default function TournamentsPage() {
  const { language } = useLanguage();
  const tr = t[language] || t.vi;
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/tournaments")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTournaments(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ONGOING":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "COMPLETED":
        return "bg-slate-50 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    if (language === "vi") {
      switch (status) {
        case "UPCOMING": return "Sắp diễn ra";
        case "ONGOING": return "Đang diễn ra";
        case "COMPLETED": return "Đã kết thúc";
        default: return status;
      }
    }
    switch (status) {
      case "UPCOMING": return "Upcoming";
      case "ONGOING": return "Ongoing";
      case "COMPLETED": return "Completed";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 size={36} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-3">
            <Trophy size={36} className="text-amber-500" />
            {tr.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{tr.desc}</p>
        </div>

        {tournaments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border dark:border-slate-700">
            <p className="text-slate-500">{tr.noTournaments}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-2 group-hover:text-blue-600 transition">
                      {t.name}
                    </h2>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${getStatusStyle(t.status)}`}>
                      {getStatusText(t.status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{t.location || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span>{formatDate(t.startDate)} - {formatDate(t.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                    {tr.viewDetails}
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

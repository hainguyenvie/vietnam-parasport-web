"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import { 
  Loader2, 
  ArrowLeft,
  Activity,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import SportEventsTab from "./SportEventsTab";
import SportClassificationsTab from "./SportClassificationsTab";

export default function SportDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sportId = params?.id as string;
  const { language } = useLanguage();
  
  const [sport, setSport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"events" | "classifications">("events");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.push("/");
      } else {
        fetchSport();
      }
    }
  }, [status, session, router, sportId]);

  const fetchSport = async () => {
    try {
      const res = await apiClient.request(`/sports/${sportId}`);
      if (res.ok) {
        const data = await res.json();
        setSport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!sport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="text-xl text-slate-500">Sport not found</div>
        <Link href={`/${language}/admin/sports`} className="text-blue-600 hover:underline">
          Back to Sports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/${language}/admin/sports`}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img">{sport.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {language === "vi" ? sport.nameVi : sport.nameEn}
            </h1>
            <p className="text-sm text-slate-500 font-mono">{sport.slug}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "events"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Activity size={18} />
          {language === "vi" ? "Nội dung thi (Events)" : "Events"}
        </button>
        <button
          onClick={() => setActiveTab("classifications")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "classifications"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <UserCheck size={18} />
          {language === "vi" ? "Hạng thương tật (Classifications)" : "Classifications"}
        </button>
      </div>

      <div>
        {activeTab === "events" && <SportEventsTab sportId={sportId} />}
        {activeTab === "classifications" && <SportClassificationsTab sportId={sportId} />}
      </div>
    </div>
  );
}

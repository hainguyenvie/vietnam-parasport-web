"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { User, Shield, Loader2 } from "lucide-react";

interface HoverProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  role: string;
  bio: string | null;
  createdAt: string;
  athleteProfile?: { sport?: { icon: string; nameVi: string; nameEn: string } };
  coachProfile?: { sport?: { icon: string; nameVi: string; nameEn: string }; specialty?: string; isVerified: boolean };
  assistantProfile?: { supportArea?: string; isVerified: boolean };
  achievements?: { count: number };
  tournamentCount?: number;
}

const profileCache = new Map<string, { data: HoverProfile; ts: number }>();
const CACHE_TTL = 60000; // 1 minute

const SUPPORT_AREA_LABELS: Record<string, Record<string, string>> = {
  vi: { MEDICAL: "Y tế", MOBILITY: "Di chuyển", LOGISTICS: "Hậu cần", OTHER: "Khác" },
  en: { MEDICAL: "Medical", MOBILITY: "Mobility", LOGISTICS: "Logistics", OTHER: "Other" },
};

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
  language?: string;
}

export function UserHoverCard({ userId, children, language = "vi" }: UserHoverCardProps) {
  const [profile, setProfile] = useState<HoverProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setProfile(cached.data);
      return;
    }

    if (pendingRef.current) return;
    pendingRef.current = true;

    setLoading(true);
    try {
      const res = await apiClient.request(`/users/${userId}/profile`);
      if (res.ok) {
        let data: HoverProfile;
        try {
          data = await res.json();
        } catch {
          setProfile(null);
          return;
        }
        if (!mountedRef.current) return;
        setProfile(data);
        profileCache.set(userId, { data, ts: Date.now() });
      }
    } catch {
      // silent fail
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      pendingRef.current = false;
    }
  }, [userId]);

  const handleMouseEnter = () => {
    leaveTimeoutRef.current && clearTimeout(leaveTimeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      fetchProfile();
    }, 300);
  };

  const handleMouseLeave = () => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timeoutRef.current && clearTimeout(timeoutRef.current);
      leaveTimeoutRef.current && clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const isAthlete = !!profile?.athleteProfile;
  const isCoach = !!profile?.coachProfile;
  const isAssistant = !!profile?.assistantProfile;

  return (
    <span className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {visible && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 animate-in fade-in slide-in-from-bottom-2 duration-200"
          onMouseEnter={() => leaveTimeoutRef.current && clearTimeout(leaveTimeoutRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {loading ? (
              <div className="p-6 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : profile ? (
              <>
                {/* Mini cover */}
                <div
                  className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 relative"
                  style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})`, backgroundSize: "cover" } : undefined}
                />

                <div className="px-4 pb-4">
                  {/* Avatar */}
                  <div className="flex justify-center -mt-8 mb-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-3 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-lg">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Name + badges */}
                  <div className="text-center mb-3">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{profile.fullName}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                      {isAthlete && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                          {profile.athleteProfile?.sport?.icon} {language === "vi" ? "VDV" : "Athlete"}
                        </span>
                      )}
                      {isCoach && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {language === "vi" ? "HLV" : "Coach"}
                          {profile.coachProfile?.isVerified && " ✓"}
                        </span>
                      )}
                      {isAssistant && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700">
                          {language === "vi" ? "Trợ lý" : "Asst"}
                          {profile.assistantProfile?.isVerified && " ✓"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini stats */}
                  {isAthlete && (
                    <div className="flex justify-center gap-4 text-center mb-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-white">{profile.achievements?.count ?? 0}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{language === "vi" ? "Thành tựu" : "Achieve"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-white">{profile.tournamentCount ?? 0}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{language === "vi" ? "Giải đấu" : "Tourn."}</p>
                      </div>
                    </div>
                  )}

                  {isCoach && profile.coachProfile?.specialty && (
                    <p className="text-xs text-slate-500 text-center mb-2">{profile.coachProfile.specialty}</p>
                  )}
                  {isAssistant && profile.assistantProfile?.supportArea && (
                    <p className="text-xs text-slate-500 text-center mb-2">
                      {SUPPORT_AREA_LABELS[language]?.[profile.assistantProfile.supportArea] || profile.assistantProfile.supportArea}
                    </p>
                  )}

                  {/* View profile link */}
                  <Link
                    href={`/users/${profile.id}`}
                    className="block w-full text-center py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded-lg transition"
                  >
                    {language === "vi" ? "Xem hồ sơ" : "View Profile"}
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">{language === "vi" ? "Không tìm thấy" : "Not found"}</div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
            <div className="w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-700 rotate-45" />
          </div>
        </div>
      )}
    </span>
  );
}

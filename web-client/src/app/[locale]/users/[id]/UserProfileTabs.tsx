"use client";

import { apiClient } from "@/lib/api-client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Building2,
  Heart,
  Users,
  Loader2,
  Shield,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";

const SUPPORT_AREA_LABELS: Record<string, Record<string, string>> = {
  vi: { MEDICAL: "Y tế", MOBILITY: "Di chuyển", LOGISTICS: "Hậu cần", OTHER: "Khác" },
  en: { MEDICAL: "Medical", MOBILITY: "Mobility", LOGISTICS: "Logistics", OTHER: "Other" },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  medal: string | null;
  result: string | null;
  isVerified: boolean;
  createdAt: string;
  tournament?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  event?: {
    id: string;
    name: string;
  } | null;
  classification?: {
    code: string;
    description: string;
  } | null;
}

interface Tournament {
  id: string;
  rank: number;
  seed: number | null;
  tournament?: {
    id: string;
    name: string;
    slug: string;
    startDate: string;
    endDate: string;
    location: string;
    bannerUrl: string;
    status: string;
  } | null;
  sport?: {
    nameVi: string;
    nameEn: string;
    slug: string;
    icon: string;
  } | null;
  classification?: {
    code: string;
    description: string;
  } | null;
}

interface Club {
  id: string;
  name: string;
  imageUrl: string | null;
  type: string | null;
  location: string | null;
  description: string | null;
}

interface CompanionItem {
  id: string;
  avatarUrl: string | null;
  fullName: string;
  supportArea?: string | null;
  sport?: { nameVi: string; nameEn: string; slug: string; icon: string } | null;
}

interface CompanionsResponse {
  companions: CompanionItem[];
  type: "athlete" | "assistant";
}

interface SponsorOrg {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface SponsorPartner {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface SponsorsResponse {
  organization: SponsorOrg | null;
  partners: SponsorPartner[];
}

// ─── Localised text ──────────────────────────────────────────────────────────

const texts: Record<string, Record<string, string>> = {
  vi: {
    achievements: "Thành tích",
    tournaments: "Giải đấu",
    clubs: "Câu lạc bộ",
    sponsors: "Nhà tài trợ",
    companion: "Người đồng hành",
    noAchievements: "Chưa có thành tích nào được ghi nhận.",
    noTournaments: "Chưa tham gia giải đấu nào.",
    noClubs: "Chưa tham gia câu lạc bộ nào.",
    loading: "Đang tải...",
    error: "Không thể tải dữ liệu.",
    featureDev: "Tính năng đang phát triển",
    noCompanions: "Chưa có thông tin đồng hành.",
    noSponsors: "Chưa có thông tin tài trợ.",
    supportAreaLabel: "Lĩnh vực hỗ trợ",
    organizationLabel: "Tổ chức",
    partnersLabel: "Đối tác",
    verified: "Đã xác minh",
    pending: "Chờ xác minh",
    dateLabel: "Ngày đạt",
    resultLabel: "Kết quả",
    sportLabel: "Bộ môn",
    locationLabel: "Địa điểm",
    from: "Từ",
    to: "đến",
  },
  en: {
    achievements: "Achievements",
    tournaments: "Tournaments",
    clubs: "Clubs",
    sponsors: "Sponsors",
    companion: "Companion",
    noAchievements: "No achievements recorded yet.",
    noTournaments: "No tournaments participated yet.",
    noClubs: "No clubs joined yet.",
    loading: "Loading...",
    error: "Failed to load data.",
    featureDev: "Feature under development",
    noCompanions: "No companion information yet.",
    noSponsors: "No sponsorship information yet.",
    supportAreaLabel: "Support Area",
    organizationLabel: "Organization",
    partnersLabel: "Partners",
    verified: "Verified",
    pending: "Pending verification",
    dateLabel: "Date achieved",
    resultLabel: "Result",
    sportLabel: "Sport",
    locationLabel: "Location",
    from: "From",
    to: "to",
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface UserProfileTabsProps {
  userId: string;
  isAthlete: boolean;
  isCoach: boolean;
  isAssistant: boolean;
  language: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMedalIcon(medal: string | null): string {
  switch (medal) {
    case "GOLD":
      return "🥇";
    case "SILVER":
      return "🥈";
    case "BRONZE":
      return "🥉";
    default:
      return "🏅";
  }
}

function getMedalBadgeClass(medal: string | null): string {
  switch (medal) {
    case "GOLD":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "SILVER":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "BRONZE":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  }
}

function formatDate(dateStr: string | undefined, lang: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getSportName(
  sport: { nameVi: string; nameEn: string } | null | undefined,
  lang: string
): string {
  if (!sport) return "";
  return lang === "vi" ? sport.nameVi : sport.nameEn;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UserProfileTabs({
  userId,
  isAthlete,
  isCoach,
  isAssistant,
  language,
}: UserProfileTabsProps) {
  const t = useMemo(() => texts[language] || texts.vi, [language]);

  // Determine available tabs before useState to avoid activeTab flash
  const availableTabs: { key: string; icon: React.ReactNode; label: string }[] = [];

  if (isAthlete) {
    availableTabs.push({ key: "achievements", icon: <Trophy size={16} />, label: t.achievements });
    availableTabs.push({ key: "tournaments", icon: <Award size={16} />, label: t.tournaments });
  }
  if (isAthlete || isCoach) {
    availableTabs.push({ key: "clubs", icon: <Building2 size={16} />, label: t.clubs });
  }
  availableTabs.push({ key: "sponsors", icon: <Heart size={16} />, label: t.sponsors });
  if (isAthlete || isAssistant) {
    availableTabs.push({ key: "companion", icon: <Users size={16} />, label: t.companion });
  }

  const [activeTab, setActiveTab] = useState<string>(availableTabs[0]?.key ?? "");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Tab buttons */}
      <div
        className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 pb-0.5 px-4 pt-1"
        role="tablist"
      >
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="min-h-[200px]">
        {activeTab === "achievements" && (
          <AchievementsTab userId={userId} language={language} />
        )}
        {activeTab === "tournaments" && (
          <TournamentsTab userId={userId} language={language} />
        )}
        {activeTab === "clubs" && (
          <ClubsTab userId={userId} language={language} />
        )}
        {activeTab === "sponsors" && (
          <SponsorsTab userId={userId} language={language} />
        )}
        {activeTab === "companion" && (
          <CompanionTab userId={userId} language={language} />
        )}
      </div>
    </div>
  );
}

// ─── Tab: Achievements ───────────────────────────────────────────────────────

function AchievementsTab({ userId, language }: { userId: string; language: string }) {
  const t = useMemo(() => texts[language] || texts.vi, [language]);
  const [data, setData] = useState<Achievement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/users/${userId}/achievements?page=1&limit=50`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          if (cancelled) return;
          setData(Array.isArray(json) ? json : json?.data ?? []);
        } else {
          setError(t.error);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.noAchievements}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((ach) => (
          <div
            key={ach.id}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{getMedalIcon(ach.medal)}</span>
                <div className="min-w-0">
                  {ach.tournament && (
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                      {ach.tournament.name}
                    </p>
                  )}
                  {ach.event && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {ach.event.name}
                    </p>
                  )}
                </div>
              </div>
              {/* Verification badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                  ach.isVerified
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                {ach.isVerified ? (
                  <Shield size={10} />
                ) : (
                  <Clock size={10} />
                )}
                {ach.isVerified ? t.verified : t.pending}
              </span>
            </div>

            {/* Medal & classification badges */}
            <div className="flex flex-wrap items-center gap-2">
              {ach.medal && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getMedalBadgeClass(ach.medal)}`}
                >
                  {ach.medal}
                </span>
              )}
              {ach.classification && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {ach.classification.code}
                </span>
              )}
              {ach.result && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {ach.result}
                </span>
              )}
            </div>

            {/* Date */}
            {ach.createdAt && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-auto">
                {t.dateLabel}: {formatDate(ach.createdAt, language)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Tournaments ────────────────────────────────────────────────────────

function TournamentsTab({ userId, language }: { userId: string; language: string }) {
  const t = useMemo(() => texts[language] || texts.vi, [language]);
  const [data, setData] = useState<Tournament[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/users/${userId}/tournaments`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          if (cancelled) return;
          setData(Array.isArray(json) ? json : json?.data ?? []);
        } else {
          setError(t.error);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.noTournaments}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-4"
          >
            {/* Rank / Medal indicator */}
            <div className="shrink-0 flex flex-col items-center justify-center w-12">
              {item.rank === 1 ? (
                <span className="text-2xl">{"🥇"}</span>
              ) : item.rank === 2 ? (
                <span className="text-2xl">{"🥈"}</span>
              ) : item.rank === 3 ? (
                <span className="text-2xl">{"🥉"}</span>
              ) : (
                <span className="text-lg font-extrabold text-slate-400 dark:text-slate-500">
                  #{item.rank}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {item.tournament && (
                <Link
                  href={`/tournaments/${item.tournament.id}`}
                  className="font-bold text-sm text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                >
                  {item.tournament.name}
                </Link>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {item.sport && (
                  <span className="inline-flex items-center gap-1">
                    <Award size={12} />
                    {getSportName(item.sport, language)}
                  </span>
                )}
                {item.tournament?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {item.tournament.location}
                  </span>
                )}
              </div>

              {item.tournament && (item.tournament.startDate || item.tournament.endDate) && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                  <Calendar size={10} />
                  {item.tournament.startDate && formatDate(item.tournament.startDate, language)}
                  {item.tournament.startDate && item.tournament.endDate && (
                    <span className="mx-0.5">-</span>
                  )}
                  {item.tournament.endDate && formatDate(item.tournament.endDate, language)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Clubs ──────────────────────────────────────────────────────────────

function ClubsTab({ userId, language }: { userId: string; language: string }) {
  const t = useMemo(() => texts[language] || texts.vi, [language]);
  const [data, setData] = useState<Club[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/users/${userId}/clubs`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          if (cancelled) return;
          setData(Array.isArray(json) ? json : json?.data ?? []);
        } else {
          setError(t.error);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.noClubs}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((club) => (
          <div
            key={club.id}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4"
          >
            {/* Logo or fallback icon */}
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
              {club.imageUrl ? (
                <img
                  src={club.imageUrl}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 size={24} className="text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                {club.name}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {club.type && <span>{club.type}</span>}
                {club.location && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin size={10} />
                    {club.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Companion ───────────────────────────────────────────────────────────

function CompanionTab({ userId, language }: { userId: string; language: string }) {
  const t = useMemo(() => texts[language] || texts.vi, [language]);
  const [data, setData] = useState<CompanionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/users/${userId}/companions`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          if (cancelled) return;
          setData(json);
        } else {
          setError(t.error);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data || !data.companions || data.companions.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.noCompanions}</p>
      </div>
    );
  }

  // Type "athlete": user is an athlete showing their assistants
  if (data.type === "athlete") {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.companions.map((com) => (
            <Link
              key={com.id}
              href={`/users/${com.id}`}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
                {com.avatarUrl ? (
                  <img src={com.avatarUrl} alt={com.fullName} className="w-full h-full object-cover" />
                ) : (
                  <Users size={24} className="text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                  {com.fullName}
                </p>
                {com.supportArea && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.supportAreaLabel}: {SUPPORT_AREA_LABELS[language]?.[com.supportArea] || com.supportArea}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Type "assistant": user is an assistant showing the athlete they support
  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.companions.map((com) => (
          <Link
            key={com.id}
            href={`/users/${com.id}`}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
              {com.avatarUrl ? (
                <img src={com.avatarUrl} alt={com.fullName} className="w-full h-full object-cover" />
              ) : (
                <Users size={24} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                {com.fullName}
              </p>
              {com.sport ? (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === "vi" ? com.sport.nameVi : com.sport.nameEn}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Sponsors ───────────────────────────────────────────────────────────

function SponsorsTab({ userId, language }: { userId: string; language: string }) {
  const t = useMemo(() => texts[language] || texts.vi, [language]);
  const [data, setData] = useState<SponsorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/users/${userId}/sponsors`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          if (cancelled) return;
          setData(json);
        } else {
          setError(t.error);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data || (!data.organization && (!data.partners || data.partners.length === 0))) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.noSponsors}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Organization */}
      {data.organization && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {t.organizationLabel}
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
              {data.organization.logoUrl ? (
                <img src={data.organization.logoUrl} alt={data.organization.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={24} className="text-slate-400" />
              )}
            </div>
            <p className="font-bold text-sm text-slate-800 dark:text-white">{data.organization.name}</p>
          </div>
        </div>
      )}

      {/* Partners */}
      {data.partners && data.partners.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {t.partnersLabel}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.partners.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-slate-400" />
                  )}
                </div>
                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import UserProfileTabs from "./UserProfileTabs";

// Simple server component — fetches data at build/request time
async function getPublicProfile(id: string) {
  try {
    const base = process.env.INTERNAL_API_URL || "http://127.0.0.1:3001";
    const res = await fetch(`${base}/api/v1/users/${id}/profile`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return null;
}

export default async function PublicUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-semibold text-lg">Không tìm thấy người dùng.</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">Quay về trang chủ</Link>
        </div>
      </div>
    );
  }

  const isAthlete = !!profile.athleteProfile;
  const isCoach = !!profile.coachProfile;
  const isAssistant = !!profile.assistantProfile;

  const roleBadges = () => {
    const b: string[] = [];
    if (isAthlete) b.push("Vận động viên");
    if (isCoach) b.push("Huấn luyện viên");
    if (isAssistant) b.push("Trợ lý");
    if (b.length === 0) b.push("Thành viên");
    return b;
  };

  const sportName = (s: any) => s?.nameVi || s?.nameEn || "";
  const sportIcon = (s: any) => s?.icon || "";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl py-12">
      {/* Cover Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl mb-8">
        <div
          className="h-48 md:h-64 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 relative"
          style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        {/* Avatar */}
        <div className="absolute bottom-0 left-6 md:left-8 translate-y-1/2">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-xl">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl select-none">{profile.fullName?.[0] || "?"}</span>
            )}
          </div>
        </div>
        {/* Info */}
        <div className="bg-white dark:bg-slate-900 px-6 md:px-8 pt-20 md:pt-24 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{profile.fullName}</h1>
                {roleBadges().map((b, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">{b}</span>
                ))}
                {isCoach && profile.coachProfile?.isVerified && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✓ Đã xác minh</span>
                )}
              </div>
              {profile.bio && <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">{profile.bio}</p>}
              <p className="text-xs text-slate-500">Tham gia {new Date(profile.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
            {/* Stats */}
            <div className="flex gap-4 md:gap-6">
              {isAthlete && (
                <>
                  <div className="text-center"><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{profile.achievements?.count ?? 0}</p><p className="text-[10px] text-slate-500 uppercase">Thành tựu</p></div>
                  <div className="text-center"><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{profile.tournamentCount ?? 0}</p><p className="text-[10px] text-slate-500 uppercase">Giải đấu</p></div>
                  <div className="text-center"><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{profile.affiliateLinks?.count ?? 0}</p><p className="text-[10px] text-slate-500 uppercase">Affiliate</p></div>
                </>
              )}
              {isCoach && <div className="text-center"><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{profile.coachProfile?.experienceYears ?? 0}</p><p className="text-[10px] text-slate-500 uppercase">Năm KN</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {isAthlete && (
          (profile.athleteProfiles || [profile.athleteProfile].filter(Boolean)).map((ap: any) => (
          <div key={ap.id || ap.sport?.slug} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Vận động viên</h3>
            <div className="space-y-2 text-sm">
              {ap.sport && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sportIcon(ap.sport)}</span>
                  <Link href={`/sports/${ap.sport.slug}`} className="font-semibold text-blue-600 hover:underline">{sportName(ap.sport)}</Link>
                </div>
              )}
              {ap.classification && (
                <p className="text-slate-600 dark:text-slate-400">{ap.classification.code} - {ap.classification.description}</p>
              )}
              {ap.organization && (
                <p className="text-slate-600 dark:text-slate-400">{ap.organization.name}</p>
              )}
            </div>
          </div>
          ))
        )}
        {isCoach && profile.coachProfile && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Huấn luyện viên</h3>
            <div className="space-y-2 text-sm">
              {profile.coachProfile.sport && <div className="flex items-center gap-2"><span className="text-lg">{sportIcon(profile.coachProfile.sport)}</span><span className="font-semibold">{sportName(profile.coachProfile.sport)}</span></div>}
              {profile.coachProfile.specialty && <p className="text-slate-600 dark:text-slate-400">Chuyên môn: {profile.coachProfile.specialty}</p>}
              {profile.coachProfile.certificateUrl && <a href={profile.coachProfile.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">Xem chứng chỉ →</a>}
            </div>
          </div>
        )}
        {isAssistant && profile.assistantProfile && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Trợ lý</h3>
            <div className="space-y-2 text-sm">
              {profile.assistantProfile.supportArea && <p className="text-slate-600 dark:text-slate-400">Lĩnh vực: {profile.assistantProfile.supportArea}</p>}
            </div>
          </div>
        )}
      </div>
      {/* Tabs: Achievements, Tournaments, Clubs, Sponsors, Companion */}
      <UserProfileTabs
        userId={profile.id}
        isAthlete={isAthlete}
        isCoach={isCoach}
        isAssistant={isAssistant}
        language="vi"
      />
    </div>
  );
}

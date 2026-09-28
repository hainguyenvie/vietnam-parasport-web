"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { Users, FileText, BookOpen, MessageSquare, LayoutDashboard, TrendingUp, MapPin, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLanguage } from '@/hooks/useTranslation';
import dynamic from 'next/dynamic';
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminCharts = dynamic(() => import('@/components/admin/AdminCharts'), { ssr: false });

const translations: Record<string, Record<string, string>> = {
  vi: {
    loadingAccess: "Đang kiểm tra quyền truy cập...",
    title: "Bảng quản trị (Admin Panel)",
    statUsers: "Người truy cập web",
    statPosts: "Bài viết xuất bản",
    statCourses: "Khóa học hiện hành",
    statComments: "Bình luận (Tất cả)",
    shortcutsTitle: "Lối tắt quản lý",
    shUsers: "Quản lý người dùng",
    shUsersDesc: "Phân quyền, khóa tài khoản, duyệt hồ sơ.",
    shPosts: "Biên tập Tin tức",
    shPostsDesc: "Tạo, sửa, xóa, duyệt bài viết CMS.",
    shClubs: "Quản lý Câu lạc bộ",
    shClubsDesc: "Phê duyệt và quản lý các câu lạc bộ người khuyết tật.",
    shCompanion: "Yêu cầu đồng hành",
    shCompanionDesc: "Quản lý thông tin tài trợ, hỗ trợ và cộng tác viên.",
    recentActivity: "Hoạt động gần đây",
    loadingLogs: "Đang tải nhật ký...",
    noLogs: "Chưa có hoạt động nào gần đây.",
    actUpdateProfile: "đã cập nhật thông tin cá nhân.",
    actChangePwd: "đã thay đổi mật khẩu đăng nhập.",
    actEnable2FA: "đã kích hoạt bảo mật hai lớp (2FA).",
    actDisable2FA: "đã hủy kích hoạt bảo mật hai lớp (2FA).",
    actChangeRole: "đã được thay đổi quyền hạn.",
    actDefault: "đã thực hiện hành động"
  },
  en: {
    loadingAccess: "Checking access permissions...",
    title: "Admin Panel",
    statUsers: "Website Visitors",
    statPosts: "Published Posts",
    statCourses: "Active Courses",
    statComments: "Comments (All)",
    shortcutsTitle: "Management Shortcuts",
    shUsers: "User Management",
    shUsersDesc: "Roles, account status, profiles.",
    shPosts: "News Editor",
    shPostsDesc: "Create, edit, delete, approve CMS posts.",
    shClubs: "Club Management",
    shClubsDesc: "Approve and manage disabled sports clubs.",
    shCompanion: "Companion Requests",
    shCompanionDesc: "Manage sponsorships, support, and collaborators.",
    recentActivity: "Recent Activity",
    loadingLogs: "Loading logs...",
    noLogs: "No recent activities found.",
    actUpdateProfile: "updated personal profile information.",
    actChangePwd: "changed login password.",
    actEnable2FA: "activated 2-factor authentication (2FA).",
    actDisable2FA: "deactivated 2-factor authentication (2FA).",
    actChangeRole: "role was updated.",
    actDefault: "performed action",
    chartGrowth: "Platform Growth (Users & Posts)",
    chartInteractions: "Platform Interactions"
  }
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;
  const loginPath = `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/admin`)}`;

  const [stats, setStats] = useState({ users: 0, posts: 0, courses: 0, comments: 0, documents: 0, capcutTemplates: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [interactionData, setInteractionData] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionCheckTimedOut, setSessionCheckTimedOut] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status !== "loading") {
      setSessionCheckTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => setSessionCheckTimedOut(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(loginPath);
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.replace(`/${locale}`);
      } else {
        // Fetch stats if admin
        apiClient.request("/statistics/dashboard-charts", {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.stats) {
              setStats(data.stats);
              setGrowthData(data.growthData || []);
              setInteractionData(data.interactionData || []);
            } else {
              console.error("Failed to fetch stats:", data);
            }
            setLoadingStats(false);
          })
          .catch(err => {
            console.error(err);
            setLoadingStats(false);
          });

        // Fetch recent audits
        apiClient.request("/users/admin/audits", {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        })
          .then(res => res.json())
          .then(data => {
            setAudits(Array.isArray(data) ? data : []);
            setLoadingAudits(false);
          })
          .catch(err => {
            console.error(err);
            setAudits([]);
            setLoadingAudits(false);
          });
      }
    }
  }, [loginPath, locale, router, session, status]);

  if (status === "loading" || !session) {
    if (sessionCheckTimedOut) {
      return (
        <div className="p-8 text-center space-y-3">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            Không thể xác minh phiên đăng nhập. Vui lòng đăng nhập lại để tiếp tục.
          </p>
          <a
            href={loginPath}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Đi tới trang đăng nhập
          </a>
        </div>
      );
    }
    return <div className="p-8 text-center">{tStr.loadingAccess}</div>;
  }

  const statCards = [
    { title: tStr.statUsers, count: loadingStats ? "..." : new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US").format(3210), icon: <Users size={24} className="text-blue-500" /> },
    { title: tStr.statPosts, count: loadingStats ? "..." : stats.posts, icon: <FileText size={24} className="text-green-500" /> },
    { title: tStr.statCourses, count: loadingStats ? "..." : stats.courses, icon: <BookOpen size={24} className="text-teal-500" /> },
    { title: tStr.statComments, count: loadingStats ? "..." : stats.comments, icon: <MessageSquare size={24} className="text-orange-500" /> },
    { title: language === 'vi' ? "Tài liệu học tập" : "Learning Documents", count: loadingStats ? "..." : stats.documents, icon: <FileText size={24} className="text-indigo-500" /> },
    { title: language === 'vi' ? "Mẫu CapCut" : "CapCut Templates", count: loadingStats ? "..." : stats.capcutTemplates, icon: <Video size={24} className="text-rose-500" /> },
  ];

  return (
    <div className="p-6">

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="flex-row items-center gap-4 py-4">
            <div className="p-3 bg-accent rounded-xl shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium whitespace-nowrap">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.count}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {isMounted && (
          <AdminCharts
            growthData={growthData}
            interactionData={interactionData}
            userLabel={language === 'vi' ? 'Người dùng' : 'Users'}
            postLabel={language === 'vi' ? 'Bài viết' : 'Posts'}
            likeLabel={language === 'vi' ? 'Lượt thích' : 'Likes'}
            commentLabel={language === 'vi' ? 'Bình luận' : 'Comments'}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-bold mb-4">{tStr.shortcutsTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { href: "/admin/users", title: tStr.shUsers, desc: tStr.shUsersDesc },
                  { href: "/admin/posts", title: tStr.shPosts, desc: tStr.shPostsDesc },
                  { href: "/admin/organizations", title: language === 'vi' ? "Đoàn / CLB" : "Organizations", desc: language === 'vi' ? "Quản lý các Đơn vị chủ quản tham gia thể thao khuyết tật." : "Manage sports organizations and clubs.", icon: MapPin },
                  { href: "/admin/teams", title: language === 'vi' ? "Đội tuyển" : "Teams", desc: language === 'vi' ? "Quản lý Đội tuyển và thành viên tham gia thi đấu đồng đội." : "Manage teams and their members.", icon: Users },
                  { href: "/admin/companion", title: tStr.shCompanion, desc: tStr.shCompanionDesc },
                  { href: "/admin/creator-lab/courses", title: language === 'vi' ? "Quản lý Khóa học" : "Courses Management", desc: language === 'vi' ? "Biên tập giáo trình, chương học, bài học và tài liệu." : "Edit curriculum, chapters, lessons, and assets." },
                  { href: "/admin/creator-lab/documents", title: language === 'vi' ? "Quản lý Tài liệu" : "Documents Management", desc: language === 'vi' ? "Quản lý tài nguyên, hướng dẫn thi đấu, phân loại, y học." : "Manage guidebooks, sports rules, classifications." },
                  { href: "/admin/creator-lab/capcut-templates", title: language === 'vi' ? "Quản lý Mẫu CapCut" : "CapCut Templates", desc: language === 'vi' ? "Biên tập danh sách các mẫu video thiết kế sẵn." : "Manage pre-designed video templates list." },
                ].map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="p-4 border rounded-xl hover:border-primary hover:shadow-md transition group"
                  >
                    {'icon' in item && item.icon ? (
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-accent text-primary rounded-lg group-hover:scale-110 transition">
                          <item.icon size={24} />
                        </div>
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-primary mb-1 group-hover:underline">{item.title}</h3>
                    )}
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="flex flex-col justify-between">
          <CardContent className="pt-6">
            <h2 className="text-lg font-bold mb-4">{tStr.recentActivity}</h2>
            <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-4">
              {loadingAudits ? (
                <div className="text-sm text-slate-500">{tStr.loadingLogs}</div>
              ) : audits.length === 0 ? (
                <div className="text-sm text-slate-500">{tStr.noLogs}</div>
              ) : (
                audits.map((audit) => {
                  let actionText = "";
                  let colorClass = "bg-blue-500";
                  
                  switch (audit.action) {
                    case "UPDATE_PROFILE":
                      actionText = tStr.actUpdateProfile;
                      colorClass = "bg-blue-500";
                      break;
                    case "CHANGE_PASSWORD":
                      actionText = tStr.actChangePwd;
                      colorClass = "bg-amber-500";
                      break;
                    case "ENABLE_2FA":
                      actionText = tStr.actEnable2FA;
                      colorClass = "bg-emerald-500";
                      break;
                    case "DISABLE_2FA":
                      actionText = tStr.actDisable2FA;
                      colorClass = "bg-red-500";
                      break;
                    case "CHANGE_ROLE":
                      actionText = tStr.actChangeRole;
                      colorClass = "bg-teal-500";
                      break;
                    default:
                      actionText = `${tStr.actDefault} ${audit.action}.`;
                      colorClass = "bg-slate-500";
                  }

                  return (
                    <div key={audit.id} className="flex gap-3 text-sm border-b border-slate-100 dark:border-slate-800/40 pb-3 last:border-0 last:pb-0">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${colorClass} shrink-0`}></div>
                      <div>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {audit.user?.fullName || (language === "vi" ? "Hệ thống" : "System")}
                          </span>{" "}
                          {actionText}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(audit.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

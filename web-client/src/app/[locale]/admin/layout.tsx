"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { 
  Users, 
  FileText, 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  MapPin, 
  Heart, 
  Handshake, 
  Menu, 
  Trophy, 
  Sun, 
  Moon, 
  LogOut, 
  Globe, 
  ChevronDown, 
  User as UserIcon,
  Settings,
  Home,
  ShieldAlert,
  Calendar,
  Award,
  HelpCircle,
  Building,
  Medal,
  CalendarDays,
  Folder,
  Lightbulb,
  Wand2,
  CheckCircle2,
  ShoppingBag,
  Mail,
  DollarSign,
  Link as LinkIcon,
  Swords,
  BarChart3
} from "lucide-react";
import { useLanguage } from '@/hooks/useTranslation';
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useSettings } from "@/components/SettingsProvider";

// next/image available for migration — add unoptimized for dynamic URLs

const translations: Record<string, Record<string, string>> = {
  vi: {
    menuTitle: "Menu quản trị",
    systemTitle: "Hệ thống quản trị",
    overview: "Tổng quan",
    users: "Người dùng",
    posts: "Tin tức",
    documents: "Tài liệu học tập",
    courses: "Khóa học",
    comments: "Bình luận",
    creatorLab: "Creator Lab",
    clubs: "Câu lạc bộ",
    companion: "Yêu cầu đồng hành",
    partners: "Đối tác & Tài trợ",
    sports: "Quản lý Bộ môn",
    emailTemplates: "Mẫu email",
    commissions: "Hoa hồng",
    affiliates: "Affiliate",
    assistants: "Người hỗ trợ",
    settings: "Cài đặt hệ thống",
    auditLogs: "Nhật ký hệ thống",
    quizzes: "Trắc nghiệm",
    tournaments: "Giải đấu",
    matches: "Lịch thi đấu",
    rankings: "Bảng xếp hạng",
    teams: "Đội tuyển",
    marketplace: "Chợ thể thao",
    events: "Sự kiện",
    signOut: "Đăng xuất",
    adminRole: "Quản trị viên",
    backToHome: "Về trang chủ"
  },
  en: {
    menuTitle: "Admin Menu",
    systemTitle: "Admin System",
    overview: "Overview",
    users: "Users",
    posts: "Posts/News",
    documents: "Learning Documents",
    courses: "Courses",
    comments: "Comments",
    creatorLab: "Creator Lab",
    clubs: "Clubs",
    companion: "Companion Requests",
    partners: "Partners & Sponsors",
    sports: "Sports Management",
    emailTemplates: "Email Templates",
    commissions: "Commissions",
    affiliates: "Affiliates",
    assistants: "Assistants",
    settings: "Settings",
    auditLogs: "Audit Logs",
    quizzes: "Quizzes",
    tournaments: "Tournaments",
    matches: "Matches",
    rankings: "Rankings",
    teams: "Teams",
    marketplace: "Marketplace",
    events: "Events",
    signOut: "Sign Out",
    adminRole: "Administrator",
    backToHome: "Back to Home"
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { language, setLanguage } = useLanguage();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { settings, loading: settingsLoading } = useSettings();

  const tStr = translations[language] || translations.vi;

  const links = [
    { name: tStr.overview, href: "/admin", exact: true, icon: <LayoutDashboard size={20} /> },
    { name: tStr.users, href: "/admin/users", icon: <Users size={20} /> },
    { name: tStr.posts, href: "/admin/posts", icon: <FileText size={20} /> },
    { name: tStr.creatorLab, href: "/admin/creator-lab", icon: <Wand2 size={20} /> },
    { name: tStr.clubs, href: "/admin/organizations", icon: <MapPin size={20} /> },
    { name: tStr.teams, href: "/admin/teams", icon: <Users size={20} /> },
    { name: tStr.companion, href: "/admin/companion", icon: <Heart size={20} /> },
    { name: tStr.partners, href: "/admin/partners", icon: <Building size={20} /> },
    { name: tStr.sports, href: "/admin/sports", icon: <Medal size={20} /> },
    { name: tStr.tournaments, href: "/admin/tournaments", icon: <Trophy size={20} /> },
    { name: tStr.rankings, href: "/admin/rankings", icon: <BarChart3 size={20} /> },
    { name: tStr.events, href: "/admin/events", icon: <Calendar size={20} /> },
    { name: tStr.auditLogs, href: "/admin/audit-logs", icon: <ShieldAlert size={20} /> },
    { name: tStr.commissions, href: "/admin/commissions", icon: <DollarSign size={20} /> },
    { name: tStr.affiliates, href: "/admin/affiliates", icon: <LinkIcon size={20} /> },
    { name: tStr.assistants, href: "/admin/assistants", icon: <Handshake size={20} /> },
    { name: tStr.marketplace, href: "/admin/marketplace", icon: <ShoppingBag size={20} /> },
    { name: tStr.settings, href: "/admin/settings", icon: <Settings size={20} /> },
  ];

  const orderedLinks = [...links];

  if (settings.ADMIN_SIDEBAR_ORDER && settings.ADMIN_SIDEBAR_ORDER.length > 0) {
    orderedLinks.sort((a, b) => {
      const aIndex = settings.ADMIN_SIDEBAR_ORDER!.indexOf(a.href);
      const bIndex = settings.ADMIN_SIDEBAR_ORDER!.indexOf(b.href);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  const visibleLinks = orderedLinks.filter(link => {
    // Only apply visibility rules if it's set in the settings, and defaults to true if not present
    if (settings.ADMIN_SIDEBAR_VISIBILITY && typeof settings.ADMIN_SIDEBAR_VISIBILITY[link.href] === 'boolean') {
      return settings.ADMIN_SIDEBAR_VISIBILITY[link.href];
    }
    return true;
  });

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current page title
  const currentLink = links.find(link => link.exact ? pathname === link.href : pathname?.startsWith(link.href));
  const pageTitle = currentLink ? currentLink.name : tStr.systemTitle;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Sidebar */}
      <aside 
        className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 shrink-0 ${
          isSidebarOpen ? "w-64" : "w-0 lg:w-16 overflow-hidden"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo or Brand */}
          <div className="flex items-center gap-2 mb-6 px-2">
            {!settingsLoading && settings.logoPath ? (
              <img loading="lazy" src={settings.logoPath} alt="Logo" className="h-8 max-w-[120px] object-contain shrink-0" />
            ) : (
              <Trophy className="text-red-600 dark:text-red-400 shrink-0" size={24} />
            )}
            {isSidebarOpen && (
              <span className="font-bold text-lg text-slate-800 dark:text-white truncate">
                ParaSports Admin
              </span>
            )}
          </div>

          <div className={`flex items-center mb-4 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
            <h2 className={`text-xs font-bold text-slate-400 uppercase tracking-wider transition-opacity ${!isSidebarOpen ? "lg:opacity-0 hidden" : "block"}`}>
              {tStr.menuTitle}
            </h2>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition cursor-pointer border-none bg-transparent"
              aria-label="Ẩn/hiện Sidebar"
            >
              <Menu size={18} />
            </button>
          </div>
          <nav className="space-y-1 flex-1">
            {visibleLinks.map((link) => {
              const isActive = link.exact ? pathname === link.href : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={!isSidebarOpen ? link.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-bold"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">{link.icon}</span>
                  <span className={`transition-opacity duration-200 ${!isSidebarOpen && "lg:hidden"}`}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Dedicated Admin Header */}
        <header className="h-16 bg-[#db3127] dark:bg-[#b5281f] border-b border-white/10 flex items-center justify-between px-6 transition-colors shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition cursor-pointer border-none bg-transparent"
                aria-label="Hiện Sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            <h1 className="text-lg font-bold text-white">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition cursor-pointer border border-white/20 bg-transparent flex items-center gap-1.5 text-xs font-bold"
              title="Switch Language"
            >
              <Globe size={16} />
              <span>{language === "vi" ? "EN" : "VI"}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition cursor-pointer border border-white/20 bg-transparent"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <span className="w-px h-6 bg-white/20 mx-1"></span>

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-xl transition cursor-pointer border-none bg-transparent"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm">
                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                  </div>
                )}
                <div className="text-left hidden md:block max-w-[120px]">
                  <p className="text-xs font-bold text-white truncate">
                    {session?.user?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-white/60 font-medium">
                    {tStr.adminRole}
                  </p>
                </div>
                <ChevronDown size={14} className="text-white/60" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-150 dark:border-slate-700 md:hidden">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {session?.user?.name || "Admin"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {tStr.adminRole}
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Home size={16} />
                    <span>{tStr.backToHome}</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center gap-2 cursor-pointer border-none bg-transparent font-medium"
                  >
                    <LogOut size={16} />
                    <span>{tStr.signOut}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

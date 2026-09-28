"use client";

import { Mic, User as UserIcon, Settings, Shield, LogOut, Bookmark, ChevronDown, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/hooks/useTranslation';
import { useSettings } from '@/components/SettingsProvider';
import { toast } from 'sonner';

const FULL_LOGO_SRC = "/assets/brand/vietnam-parasports-2026-full.png";

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sportsDropdownOpen, setSportsDropdownOpen] = useState(false);
  const sportsDropdownRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();

  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("high-contrast") === "true";
    setIsHighContrast(saved);
    if (saved) {
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const toggleHighContrast = () => {
    const next = !isHighContrast;
    setIsHighContrast(next);
    localStorage.setItem("high-contrast", String(next));
    if (next) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (sportsDropdownRef.current && !sportsDropdownRef.current.contains(event.target as Node)) {
        setSportsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdminRoute = pathname && (pathname.startsWith('/admin') || /^\/[a-z]{2}\/admin/.test(pathname));
  if (isAdminRoute) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Trình duyệt của bạn không hỗ trợ tìm kiếm bằng giọng nói.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      router.push(`/search?q=${encodeURIComponent(transcript)}`);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const sportsList = [
    { name: language === "vi" ? "Cử tạ" : "Powerlifting", slug: "cu-ta", icon: "🏋️‍♂️" },
    { name: language === "vi" ? "Bơi lội" : "Swimming", slug: "boi-loi", icon: "🏊‍♂️" },
    { name: language === "vi" ? "Điền kinh" : "Athletics", slug: "dien-kinh", icon: "🏃‍♂️" },
    { name: language === "vi" ? "Bóng bàn" : "Table Tennis", slug: "bong-ban", icon: "🏓" },
    { name: language === "vi" ? "Cầu lông" : "Badminton", slug: "cau-long", icon: "🏸" },
    { name: language === "vi" ? "Bắn cung" : "Archery", slug: "ban-cung", icon: "🏹" },
    { name: language === "vi" ? "Bóng rổ xe lăn" : "Wheelchair Basketball", slug: "bong-ro-xe-lan", icon: "🏀" },
    { name: language === "vi" ? "Quần vợt xe lăn" : "Wheelchair Tennis", slug: "quan-vot-xe-lan", icon: "🎾" },
    { name: language === "vi" ? "Cờ vua" : "Chess", slug: "co-vua", icon: "♟️" },
    { name: language === "vi" ? "Cờ tướng" : "Xiangqi", slug: "co-tuong", icon: "🎲" },
    { name: language === "vi" ? "Judo khiếm thị" : "Para Judo", slug: "judo-khiem-thi", icon: "🥋" },
  ];

  const headerStyle = {
    backgroundColor: settings.HEADER_COLOR || 'var(--header-bg, #1e3a8a)',
    '--header-fg': settings.HEADER_TEXT_COLOR || 'var(--header-fg-default, #ffffff)'
  } as React.CSSProperties;

  return (
    <header className="flex justify-between items-center p-2.5 md:p-3 border-b border-[var(--header-fg)]/10 sticky top-0 z-50 transition-colors duration-300" role="banner" style={headerStyle}>
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-white px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)]"
          aria-label="Trang chủ Vietnam ParaSports"
        >
          <img
            src={FULL_LOGO_SRC}
            alt="Vietnam ParaSports 2026"
            className="h-12 w-auto max-w-[220px] flex-shrink-0 object-contain md:h-14"
          />
        </Link>
        <nav className="hidden lg:flex items-center gap-2 lg:gap-4 font-semibold text-sm lg:text-base text-[var(--header-fg)]/90" role="navigation" aria-label="Menu chính">
          {(() => {
            const defaultMenuOrder = ['about', 'sports', 'matches', 'rankings', 'marketplace', 'creator-lab', 'news', 'clubs', 'companion'];
            const menuOrder = (settings.HEADER_MENU_ORDER && Array.isArray(settings.HEADER_MENU_ORDER)) ? settings.HEADER_MENU_ORDER : defaultMenuOrder;
            const menuVisibility = settings.HEADER_MENU_VISIBILITY || {};

            return menuOrder.filter(id => menuVisibility[id] !== false).map(id => {
              switch(id) {
                case 'about': return <Link key={id} href="/about" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navAbout")}</Link>;
                case 'sports': return (
                  <div key={id} className="relative" ref={sportsDropdownRef}>
                    <button 
                      onClick={() => setSportsDropdownOpen(!sportsDropdownOpen)}
                      className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2 flex items-center gap-1 cursor-pointer"
                      aria-expanded={sportsDropdownOpen}
                      aria-haspopup="true"
                    >
                      {t("navSports")} <ChevronDown size={14} className={`transition-transform duration-200 ${sportsDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sportsDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-[var(--header-fg)] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="p-1 space-y-0.5">
                          {sportsList.map((sport) => (
                            <Link 
                              key={sport.slug}
                              href={`/sports/${sport.slug}`}
                              onClick={() => setSportsDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition"
                            >
                              <span className="text-base">{sport.icon}</span>
                              <span>{sport.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
                case 'matches': return <Link key={id} href="/matches" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navMatches")}</Link>;
                case 'rankings': return <Link key={id} href="/rankings" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navRankings")}</Link>;
                case 'creator-lab': return <Link key={id} href="/creator-lab" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navCreatorLab")}</Link>;
                case 'news': return <Link key={id} href="/news" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navNews")}</Link>;
                case 'clubs': return <Link key={id} href="/clubs" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navClubs")}</Link>;
                case 'marketplace': return <Link key={id} href="/marketplace" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navMarketplace")}</Link>;
case 'companion': return <Link key={id} href="/companion" className="hover:text-[var(--header-fg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] rounded px-2">{t("navCompanion")}</Link>;
                default: return null;
              }
            });
          })()}
        </nav>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--header-fg)]/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)] text-[var(--header-fg)]"
          aria-label={mobileMenuOpen ? (language === "vi" ? "Đóng menu" : "Close menu") : (language === "vi" ? "Mở menu" : "Open menu")}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative hidden md:block" aria-label="Thanh tìm kiếm">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")} 
            className="pl-4 pr-10 py-2 rounded-full border border-[var(--header-fg)]/20 bg-[var(--header-fg)]/10 text-[var(--header-fg)] placeholder:text-[var(--header-fg)]/60 focus:ring-2 focus:ring-[var(--header-fg)]/50 text-sm w-64"
          />
          <button 
            type="button"
            onClick={handleVoiceSearch}
            aria-label="Tìm kiếm bằng giọng nói" 
            className={`absolute right-3 top-2.5 hover:text-blue-500 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}
          >
            <Mic size={18} />
          </button>
        </form>
        
        {/* Tài khoản */}
        <div className="flex items-center gap-3" aria-label="Tài khoản">
          {status === "loading" ? (
            <Link
              href="/login"
              aria-label={language === "vi" ? "Mở trang đăng nhập" : "Open sign in page"}
              title={language === "vi" ? "Đăng nhập" : "Sign in"}
              className="flex items-center gap-2 px-3 py-1.5 border border-[var(--header-fg)]/20 rounded-full hover:bg-[var(--header-fg)]/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)]"
            >
              <UserIcon size={18} aria-hidden="true" />
              <span className="text-sm font-medium hidden sm:block text-[var(--header-fg)]">
                {language === "vi" ? "Đăng nhập" : "Sign in"}
              </span>
            </Link>
          ) : session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[var(--header-fg)]/20 rounded-full hover:bg-[var(--header-fg)]/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-fg)]"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--header-fg)]/20 flex items-center justify-center text-[var(--header-fg)]">
                  <UserIcon size={14} />
                </div>
                <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate text-[var(--header-fg)]">
                  {(session.user as any).name || 'User'}
                </span>
                <ChevronDown size={14} className="text-[var(--header-fg)]/60" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--header-fg)] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold truncate">{(session.user as any).name}</p>
                    <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                  </div>
                  
                  <div className="p-1">
                    <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      <UserIcon size={16} /> {t("btnProfile")}
                    </Link>
                    <Link href="/bookmarks" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Bookmark size={16} /> {t("btnBookmarks")}
                    </Link>
                    <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Settings size={16} /> {t("btnSettings")}
                    </Link>
                    
                    {((session.user as any).role === 'SUPER_ADMIN' || (session.user as any).role === 'ADMIN') && (
                      <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400">
                        <Shield size={16} /> {t("btnAdmin")}
                      </Link>
                    )}
                  </div>
                  
                  <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/' }); }} 
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 w-full text-left cursor-pointer border-none"
                    >
                      <LogOut size={16} /> {t("btnSignOut")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-[var(--header-fg)] text-sm font-medium rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t("btnSignIn")}
            </Link>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[58px] bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-72 bg-[var(--header-fg)] dark:bg-slate-900 shadow-xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={language === "vi" ? "Menu di động" : "Mobile menu"}
          >
            <nav className="flex flex-col gap-3">
              {(() => {
                const defaultMenuOrder = ['about', 'sports', 'matches', 'rankings', 'marketplace', 'creator-lab', 'news', 'clubs', 'companion'];
                const menuOrder = (settings.HEADER_MENU_ORDER && Array.isArray(settings.HEADER_MENU_ORDER)) ? settings.HEADER_MENU_ORDER : defaultMenuOrder;
                const menuVisibility = settings.HEADER_MENU_VISIBILITY || {};
                return menuOrder.filter(id => menuVisibility[id] !== false).map(id => {
                  const labels: Record<string, string> = {
                    about: t("navAbout"), sports: t("navSports"), matches: t("navMatches"),
                    rankings: t("navRankings"), 'creator-lab': t("navCreatorLab"), news: t("navNews"),
                    clubs: t("navClubs"), companion: t("navCompanion"), marketplace: t("navMarketplace"),
                  };
                  const hrefs: Record<string, string> = {
                    about: '/about', sports: '/sports', matches: '/matches', rankings: '/rankings',
                    'creator-lab': '/creator-lab', news: '/news', clubs: '/clubs', companion: '/companion',
                    marketplace: '/marketplace',
                  };
                  return (
                    <Link
                      key={id}
                      href={hrefs[id] || '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-800"
                    >
                      {labels[id] || id}
                    </Link>
                  );
                });
              })()}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

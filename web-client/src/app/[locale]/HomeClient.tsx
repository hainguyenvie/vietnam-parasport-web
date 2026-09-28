"use client";

import { apiClient } from "@/lib/api-client";

import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Users, Newspaper, Heart, Calendar, Bell, Flag, ChevronDown, Award, Volume2, MessageSquare, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useTranslation';
import { useSettings } from '@/components/SettingsProvider';
import SportsCarousel from '@/components/SportsCarousel';
import Marquee from '@/components/Marquee';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  createdAt: string;
  category?: { name: string };
}

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
}

const translations: Record<string, Record<string, string>> = {
  vi: {
    heroTag: "Vietnam ParaSports",
    heroTitle: "Thể thao không rào cản",
    heroDesc: "Cổng thông tin báo chí và kết nối cộng đồng thể thao người khuyết tật Việt Nam. Tôn vinh năng lực, kết nối tài trợ, đồng hành cùng VĐV.",
    heroCreatorLabBtn: "Creator Lab Xây Kênh",
    heroClubsBtn: "Tìm Kiếm CLB NKT",
    newsHeading: "Bản Tin ParaSports",
    noPosts: "Chưa có bài viết nào thuộc chuyên mục này.",
    readPost: "Đọc bài viết",
    featured: "Tiêu điểm",
    sideHeading: "Tin bài liên quan",
    noSidePosts: "Không có tin bài liên quan khác.",
    companionBoxTag: "Đồng hành lan tỏa",
    companionBoxTitle: "Hỗ trợ vận động viên khuyết tật tự kể câu chuyện của mình",
    companionBoxBtn: "Đăng ký CTV/Đối tác",
    eventsHeading: "Sự kiện sắp diễn ra",
    clubsHeading: "Hoạt động câu lạc bộ",
    clubsLink: "Xem danh mục các câu lạc bộ",
    creatorLabHeading: "Thông báo Creator Lab",
    creatorLabLink: "Vào Creator Lab học ngay",
    sportsHeading: "Môn thể thao Paralympic tiêu biểu",
    sportsDesc: "Chọn bộ môn để xem tin tức, bài giảng tập luyện và câu lạc bộ.",
    sportsExplore: "Khám phá",
    partnersHeading: "Đối tác đồng hành & tài trợ",
    statsHeading: "Vietnam ParaSports qua những con số",
    partnersLoading: "Đang tải đối tác...",
    noPartners: "Chưa có đối tác đồng hành nào được cập nhật.",
    noImage: "Ảnh",
    noImageBig: "Không có ảnh"
  },
  en: {
    heroTag: "Vietnam ParaSports",
    heroTitle: "Sports Without Barriers",
    heroDesc: "Portal connecting the Vietnam Paralympic sports community. Celebrating capabilities, connecting sponsorships, accompanying athletes.",
    heroCreatorLabBtn: "Creator Lab Channel Builder",
    heroClubsBtn: "Find Disabled Sports Clubs",
    newsHeading: "ParaSports News",
    noPosts: "No articles found in this category.",
    readPost: "Read Article",
    featured: "Featured",
    sideHeading: "Related Articles",
    noSidePosts: "No other related articles.",
    companionBoxTag: "Accompany & Spread",
    companionBoxTitle: "Support disabled athletes to tell their own stories",
    companionBoxBtn: "Register as Collaborator/Partner",
    eventsHeading: "Upcoming Events",
    clubsHeading: "Club Activities",
    clubsLink: "View all clubs directory",
    creatorLabHeading: "Creator Lab Announcements",
    creatorLabLink: "Go to Creator Lab now",
    sportsHeading: "Featured Paralympic Sports",
    sportsDesc: "Select a sport to view related news, training courses, and clubs.",
    sportsExplore: "Explore",
    partnersHeading: "Accompanying Partners & Sponsors",
    statsHeading: "Vietnam ParaSports in Numbers",
    partnersLoading: "Loading partners...",
    noPartners: "No accompanying partners updated yet.",
    noImage: "Image",
    noImageBig: "No image"
  }
};

export default function HomeClient({ initialData }: { initialData?: {
  posts: Post[];
  partners: Partner[];
  statistics: any[];
  sportsShowcase: any[];
} }) {
  const { language } = useLanguage();
  const { settings, loading: settingsLoading } = useSettings();
  const tStr = translations[language] || translations.vi;

  const [currentSlide, setCurrentSlide] = useState(0);

  const [posts, setPosts] = useState<Post[]>(initialData?.posts || []);
  const [mainPosts, setMainPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(!initialData);
  const [loadingMainPosts, setLoadingMainPosts] = useState(true);

  const [partners, setPartners] = useState<Partner[]>(initialData?.partners || []);
  const [loadingPartners, setLoadingPartners] = useState(!initialData);

  const [statistics, setStatistics] = useState<any[]>(initialData?.statistics || []);
  const [sportsShowcase, setSportsShowcase] = useState<any[]>(initialData?.sportsShowcase || []);

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [visiblePostsCount, setVisiblePostsCount] = useState(8);
  const [totalMainPosts, setTotalMainPosts] = useState(0);

  const categorySlugs = [null, "the-thao", "su-kien"];
  const newsCategories = language === "vi" 
    ? ['Tất cả', 'Thể Thao', 'Sự Kiện'] 
    : ['All', 'Sports', 'Events'];

  // Fetch for secondary widgets (one time)
  useEffect(() => {
    apiClient.request("/posts?take=30")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const mappedDbPosts = (data || []).map((post: any) => ({
          ...post,
          category: post.category || { name: 'Tin tức chung' }
        }));
        setPosts(mappedDbPosts);
        setLoadingPosts(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingPosts(false);
      });

    apiClient.request("/partners")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setPartners(data);
        setLoadingPartners(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingPartners(false);
      });

    apiClient.request("/statistics/summary")
      .then(res => res.ok ? res.json() : [])
      .then(data => setStatistics(data))
      .catch(console.error);

    apiClient.request("/sports")
      .then(res => res.ok ? res.json() : [])
      .then(data => setSportsShowcase(data))
      .catch(console.error);
  }, [language]);

  // Fetch for Main Posts Tab
  useEffect(() => {
    const slug = categorySlugs[selectedCategoryIndex];
    setLoadingMainPosts(true);
    apiClient.request(`/posts/paginated?limit=${visiblePostsCount}${slug ? `&categorySlug=${slug}` : ''}`)
      .then(res => {
        if (!res.ok) {
          setMainPosts([]);
          setTotalMainPosts(0);
          setLoadingMainPosts(false);
          return;
        }
        // res.data is the raw parsed response: { success, data, meta }
        // Use .data directly instead of .json() to avoid losing the meta sibling
        const raw = res.data as any;
        const posts = raw.data || [];
        const mapped = posts.map((post: any) => ({
          ...post,
          category: post.category || { name: 'Tin tức chung' }
        }));
        setMainPosts(mapped);
        setTotalMainPosts(raw.meta?.total || 0);
        setLoadingMainPosts(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingMainPosts(false);
      });
  }, [selectedCategoryIndex, visiblePostsCount]);

  // Carousel logic
  useEffect(() => {
    if (settings.heroCarousel && settings.heroCarousel.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % settings.heroCarousel.length);
      }, 5000); // 5 seconds per slide
      return () => clearInterval(timer);
    }
  }, [settings.heroCarousel]);

  // Filter posts based on selected category index (DEPRECATED - Now fetched from API directly)
  // Divide fetched mainPosts into featured and standard
  const featuredPost = mainPosts[0];
  const sidePosts = mainPosts.slice(1, 4);
  const bottomPosts = mainPosts.slice(4);

  // Map real posts to widgets (Using global 'posts' state)
  const upcomingEvents = posts
    .filter(post => (post.category as any)?.slug === 'tin-tuc-chung' || (post.category as any)?.slug === 'cac-mon-the-thao')
    .slice(0, 2);

  const clubActivities = posts
    .filter(post => (post.category as any)?.slug === 'hoat-dong-clb')
    .slice(0, 2);

  const creatorLabAnnouncements = posts
    .filter(post => (post.category as any)?.slug === 'creator-lab')
    .slice(0, 2);



  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* 1. HERO SLIDER BANNER */}
      <section 
        className="relative overflow-hidden bg-slate-900 flex items-center" 
        style={{ 
          height: `${settings.HERO_BANNER_SIZE === 'large' ? '80' : settings.HERO_BANNER_SIZE === 'small' ? '50' : Number(settings.HERO_BANNER_SIZE) || 60}vh`,
          minHeight: '400px' 
        }}
        aria-labelledby="banner-heading"
      >
        {/* Slides */}
        {!settingsLoading && settings.heroCarousel && settings.heroCarousel.length > 0 ? (
          settings.heroCarousel.map((slide, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <Image
                src={slide.url}
                alt={slide.title || "Hero slide"}
                fill
                priority={idx === 0}
                sizes="100vw"
                className={`w-full h-full ${settings.HERO_IMAGE_FIT === 'contain' ? 'object-contain' : 'object-cover'}`}
              />
              {settings.HERO_SHOW_CONTENT !== false && (
                <div className="absolute inset-0 bg-black/50"></div>
              )}
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 z-10"></div>
        )}

        {/* Content Overlay */}
        {settings.HERO_SHOW_CONTENT !== false && (
          <div className="relative z-20 w-full py-20 px-4 text-white text-center">
            <div className="max-w-5xl mx-auto space-y-6">
              <span className="inline-block bg-white/20 border border-white/10 rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
                {tStr.heroTag}
              </span>
              <h1 id="banner-heading" className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                {language === "vi" ? settings?.heroContent?.titleVi : settings?.heroContent?.titleEn}
              </h1>
              <p className="text-base md:text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
                {language === "vi" ? settings?.heroContent?.descVi : settings?.heroContent?.descEn}
              </p>
              <div className="flex justify-center gap-4 pt-6">
                <Link href="/creator-lab" className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition">
                  {tStr.heroCreatorLabBtn}
                </Link>
                <Link href="/clubs" className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-bold transition backdrop-blur-sm">
                  {tStr.heroClubsBtn}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Indicators */}
        {!settingsLoading && settings.heroCarousel && settings.heroCarousel.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
            {settings.heroCarousel.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        )}
      </section>

      {/* 2. CHUYÊN TRANG TIN TỨC & BÁO CHÍ (NEWS PORTAL LAYOUT) */}
      <section className="max-w-7xl mx-auto py-16 px-4 space-y-8" aria-label="Bản tin chính">
        
        {/* Bộ lọc Chuyên mục */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Newspaper className="text-blue-600" />
            {tStr.newsHeading}
          </h2>
          <div className="flex flex-wrap gap-2">
            {newsCategories.map((cat, idx) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategoryIndex(idx);
                  setVisiblePostsCount(8); // Reset số lượng hiển thị khi đổi tab
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedCategoryIndex === idx
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loadingMainPosts && mainPosts.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
            <div className="lg:col-span-2 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        ) : !featuredPost ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border dark:border-slate-800">
            <p className="text-slate-500">{tStr.noPosts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cột trái (2/3): Tin tiêu điểm chính (Featured News Card) */}
            <div className="lg:col-span-2">
              <article className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full focus-within:ring-2 focus-within:ring-blue-500">
                <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                  <span className="absolute top-4 left-4 z-10 text-[10px] font-bold text-white bg-blue-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {featuredPost.category?.name || tStr.featured}
                  </span>
                  {featuredPost.thumbnail ? (
                    <img src={featuredPost.thumbnail} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">{tStr.noImageBig}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none"></div>
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1.5">
                      <Calendar size={12} className="text-blue-500" />
                      {new Date(featuredPost.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white hover:text-blue-600 transition leading-snug relative">
                      <Link href={`/news/${featuredPost.slug}`} className="focus:outline-none before:absolute before:inset-0">
                        {featuredPost.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>
                  <div className="pt-6 border-t dark:border-slate-800 mt-6 flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{tStr.readPost} &rarr;</span>
                  </div>
                </div>
              </article>
            </div>

            {/* Cột phải (1/3): Danh sách bài viết phụ (Sidebar News List) */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b dark:border-slate-800 pb-2">{tStr.sideHeading}</h3>
              
              {sidePosts.length === 0 ? (
                <p className="text-xs text-slate-500">{tStr.noSidePosts}</p>
              ) : (
                <div className="space-y-4">
                  {sidePosts.map((post) => (
                    <article key={post.id} className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-800 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex gap-4 focus-within:ring-2 focus-within:ring-blue-500">
                      <div className="w-24 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 relative">
                        {post.thumbnail ? (
                          <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">{tStr.noImage}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none"></div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-white line-clamp-2 hover:text-blue-600 relative">
                          <Link href={`/news/${post.slug}`} className="focus:outline-none before:absolute before:inset-0">
                            {post.title}
                          </Link>
                        </h4>
                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{post.category?.name}</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={10} className="text-slate-400" />
                            {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Lối tắt tuyển CTV/Đồng hành nhanh */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 space-y-3">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{tStr.companionBoxTag}</span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-snug">{tStr.companionBoxTitle}</h4>
                <Link href="/companion" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  {tStr.companionBoxBtn}
                  <ArrowRight size={14} />
                </Link>
              </div>

            </div>

          </div>
        )}

        {/* Khối tin tức hàng dưới (Bottom News Grid - 4 Columns) */}
        {mainPosts.length > 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t dark:border-slate-800">
            {bottomPosts.map((post) => (
              <article key={post.id} className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-800 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between h-72">
                <div className="space-y-3">
                  <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">{tStr.noImage}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent pointer-events-none"></div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 hover:text-blue-600">
                    <Link href={`/news/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h4>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4 pt-3 border-t dark:border-slate-800">
                  <span className="font-semibold text-blue-500 dark:text-blue-400">{post.category?.name}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} className="text-slate-400" />
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Nút Xem thêm */}
        {totalMainPosts > visiblePostsCount && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setVisiblePostsCount(prev => prev + 4)}
              disabled={loadingMainPosts}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loadingMainPosts ? 'Đang tải...' : 'Xem thêm bài viết'} <ChevronDown size={16} />
            </button>
          </div>
        )}

      </section>

      {/* 3. DÒNG SỰ KIỆN & HOẠT ĐỘNG KHÁC (SECONDARY WIDGETS) */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lịch sự kiện */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Calendar className="text-indigo-600" />
              {tStr.eventsHeading}
            </h3>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <Link href={`/news/${event.slug}`} key={event.id} className="block pb-4 border-b dark:border-slate-800 last:border-0 last:pb-0 space-y-1 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                    {event.category?.name || "Sự kiện"}
                  </span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white pt-1 group-hover:text-indigo-600 transition-colors line-clamp-2">{event.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{language === "vi" ? "Đăng ngày:" : "Posted:"} {new Date(event.createdAt).toLocaleDateString("vi-VN")}</p>
                </Link>
              )) : (
                <p className="text-xs text-slate-500 italic">{tStr.noPostsMessage || "Đang cập nhật..."}</p>
              )}
            </div>
          </div>

          {/* Hoạt động CLB */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Users className="text-emerald-600" />
              {tStr.clubsHeading}
            </h3>
            <div className="space-y-4 text-xs">
              {clubActivities.length > 0 ? clubActivities.map(act => (
                <Link href={`/news/${act.slug}`} key={act.id} className="block pb-3 border-b dark:border-slate-800 last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors">
                  <span className="font-bold text-emerald-600 block group-hover:text-emerald-500 transition-colors line-clamp-2">{act.title}</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{act.excerpt}</p>
                </Link>
              )) : (
                <p className="text-xs text-slate-500 italic">{tStr.noPostsMessage || "Đang cập nhật..."}</p>
              )}
            </div>
            <Link href="/clubs" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {tStr.clubsLink} &rarr;
            </Link>
          </div>

          {/* Thông báo Creator Lab */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="text-orange-500" />
              {tStr.creatorLabHeading}
            </h3>
            <div className="space-y-4 text-xs">
              {creatorLabAnnouncements.length > 0 ? creatorLabAnnouncements.map(announce => (
                <Link href={`/news/${announce.slug}`} key={announce.id} className="block pb-3 border-b dark:border-slate-800 last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors">
                  <span className="text-slate-400 block">{new Date(announce.createdAt).toLocaleDateString("vi-VN")}</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1 group-hover:text-orange-500 transition-colors line-clamp-2">{announce.title}</p>
                </Link>
              )) : (
                <p className="text-xs text-slate-500 italic">{tStr.noPostsMessage || "Đang cập nhật..."}</p>
              )}
            </div>
            <Link href="/creator-lab" className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
              {tStr.creatorLabLink} &rarr;
            </Link>
          </div>

        </div>
      </section>

      {/* 4. MÔN THỂ THAO PARALYMPIC (SPORTS SHOWCASE COMPACT) */}
      <section className="max-w-7xl mx-auto py-16 px-4 space-y-6" aria-labelledby="sports-heading">
        <div className="text-center space-y-2">
          <h2 id="sports-heading" className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{tStr.sportsHeading}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{tStr.sportsDesc}</p>
        </div>

        {sportsShowcase.length > 0 ? (
          <Marquee speed={25}>
            {sportsShowcase.map((sport, idx) => (
              <Link
                key={idx}
                href={`/sports/${sport.slug}`}
                className="shrink-0 w-44 sm:w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="text-2xl">{sport.icon}</span>
                <h4 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                  {language === "vi" ? sport.nameVi : sport.nameEn}
                </h4>
              </Link>
            ))}
          </Marquee>
        ) : (
          <div className="text-center py-8 text-sm text-slate-500">
            Đang cập nhật danh sách môn thể thao...
          </div>
        )}
      </section>

      {/* 5. VIETNAM PARASPORTS BẰNG NHỮNG CON SỐ (STATS) */}
      <section className="max-w-7xl mx-auto py-16 px-4 space-y-6" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white text-center flex items-center justify-center gap-2">
          <Flag className="text-red-500" size={20} />
          {tStr.statsHeading}
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border dark:border-slate-800 text-center grid grid-cols-2 md:grid-cols-4 gap-6">
          {statistics.length > 0 ? statistics.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <span className="block text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stat.value}</span>
              <h4 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">{language === "vi" ? stat.labelVi : stat.labelEn}</h4>
              <p className="text-[10px] text-slate-400">{language === "vi" ? stat.descVi : stat.descEn}</p>
            </div>
          )) : (
            <div className="col-span-full py-4 text-sm text-slate-500">
              Đang tải thống kê...
            </div>
          )}
        </div>
      </section>

      {/* 7. ĐƠN VỊ ĐỒNG HÀNH (Marquee logo) */}
      {settings?.SHOW_PARTNERS !== false && (
        <section className="max-w-7xl mx-auto py-16 px-4 space-y-6 overflow-hidden">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white text-center flex items-center justify-center gap-2">
            <Award className="text-amber-500" size={20} />
            {tStr.partnersHeading}
          </h2>
          
          {loadingPartners ? (
            <div className="flex justify-center items-center h-16">
              <div className="animate-pulse flex gap-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-32 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : partners.length === 0 ? (
            <p className="text-xs text-slate-400 text-center">{tStr.noPartners}</p>
          ) : (
            <Marquee>
              {partners.map((partner) => (
                <a
                  key={partner.id}
                  href={partner.website || "#"}
                  target={partner.website ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="inline-block hover:scale-105 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 shrink-0"
                  title={partner.name}
                >
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="h-10 md:h-12 w-auto object-contain dark:brightness-110 dark:contrast-110 max-w-[140px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <span className="hidden text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border">
                    {partner.name}
                  </span>
                </a>
              ))}
            </Marquee>
          )}
        </section>
      )}

    </main>
  );
}

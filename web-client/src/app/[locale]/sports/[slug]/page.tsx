"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Newspaper, MapPin, Calendar, ArrowLeft, Trophy, GraduationCap, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslation';
import SportsCarousel from '@/components/SportsCarousel';

import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  createdAt: string;
  category?: { name: string };
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
}

interface Club {
  id: string;
  name: string;
  location: string;
  sport: string;
  schedule: string;
}

const sportsMap: Record<
  string,
  {
    vi: { name: string; desc: string; detailDesc: string };
    en: { name: string; desc: string; detailDesc: string };
    icon: string;
    dbName: string;
  }
> = {
  "cu-ta": { 
    vi: {
      name: "Cử tạ",
      desc: "Bộ môn cử tạ Paralympic đòi hỏi sức mạnh thân trên và kỹ thuật đẩy ngực tối ưu.",
      detailDesc: "Cử tạ người khuyết tật (Para Powerlifting) là bộ môn thi đấu chính thức tại Paralympic từ năm 1984. VĐV thi đấu ở tư thế nằm ngửa đẩy tạ (bench press). Đây là môn thể thao phát triển rất mạnh tại Việt Nam với nhiều kỷ lục gia thế giới như VĐV Lê Văn Công."
    },
    en: {
      name: "Powerlifting",
      desc: "Paralympic powerlifting requires upper body strength and optimal bench press technique.",
      detailDesc: "Para Powerlifting is an official Paralympic sport since 1984. Athletes compete in a bench press position. This sport has developed very strongly in Vietnam with many world-record holders such as Le Van Cong."
    },
    icon: "🏋️‍♂️",
    dbName: "Cử tạ"
  },
  "boi-loi": { 
    vi: {
      name: "Bơi lội",
      desc: "Đường đua xanh tôn vinh sự bền bỉ, kỹ thuật quạt tay và khát vọng vươn lên.",
      detailDesc: "Bơi lội trợ năng (Para Swimming) cho phép các VĐV ở nhiều phân hạng thương tật khác nhau tham gia thi đấu với các nội dung bơi tự do, bơi ngửa, bơi ếch và bơi bướm. Bộ môn giúp cải thiện hệ tim mạch, tăng cường thể tích phổi và phát triển cơ tay vai vượt trội."
    },
    en: {
      name: "Swimming",
      desc: "The blue lanes honor resilience, stroke technique, and the aspiration to rise.",
      detailDesc: "Para Swimming allows athletes with different disability classifications to compete in freestyle, backstroke, breaststroke, and butterfly events. The sport helps improve the cardiovascular system, lung capacity, and arm/shoulder muscle development."
    },
    icon: "🏊‍♂️",
    dbName: "Bơi lội"
  },
  "dien-kinh": { 
    vi: {
      name: "Điền kinh",
      desc: "Bộ môn điền kinh đua xe lăn hoặc chạy điền kinh trợ năng cho nhiều hạng thương tật.",
      detailDesc: "Điền kinh người khuyết tật (Para Athletics) bao gồm các nội dung chạy, nhảy xa, ném đĩa, đẩy tạ. Đây là môn thể thao thu hút số lượng VĐV đông đảo nhất nhờ tính đa dạng phân loại thương tật và trang thiết bị hỗ trợ hiện đại như xe lăn chuyên dụng."
    },
    en: {
      name: "Athletics",
      desc: "Wheelchair racing or assistive track and field running for multiple classifications.",
      detailDesc: "Para Athletics includes track events, long jump, discus throw, and shot put. It is the sport with the largest athlete participation due to its diverse classification system and modern equipment such as specialized wheelchairs."
    },
    icon: "🏃‍♂️",
    dbName: "Điền kinh"
  },
  "bong-ban": { 
    vi: {
      name: "Bóng bàn",
      desc: "Rèn luyện phản xạ nhanh nhạy, kỹ năng phối hợp tay mắt và sự tập trung cao độ.",
      detailDesc: "Bóng bàn người khuyết tật (Para Table Tennis) được chia làm các nhóm đứng thi đấu hoặc ngồi xe lăn. Bộ môn giúp phát triển kỹ năng phản xạ thần tốc, tăng cường phối hợp tay mắt và sự tập trung trí não tối đa."
    },
    en: {
      name: "Table Tennis",
      desc: "Trains quick reflexes, hand-eye coordination skills, and high mental concentration.",
      detailDesc: "Para Table Tennis is divided into standing and wheelchair categories. The sport develops rapid reflexes, enhances hand-eye coordination, and maximizes brain concentration."
    },
    icon: "🏓",
    dbName: "Bóng bàn"
  },
  "cau-long": { 
    vi: {
      name: "Cầu lông",
      desc: "Giao lưu cầu lông xe lăn hoặc cầu lông đứng, tăng cường thể lực và tính kết nối.",
      detailDesc: "Cầu lông người khuyết tật (Para Badminton) có tốc độ thi đấu rất cao. VĐV có thể thi đấu xe lăn hoặc đứng tùy theo phân hạng thương tật, rèn luyện cơ bắp phần thân trên, sự linh hoạt và khả năng định vị khoảng không gian nhanh chóng."
    },
    en: {
      name: "Badminton",
      desc: "Wheelchair or standing badminton matches, enhancing physical strength and social connection.",
      detailDesc: "Para Badminton features very high-speed gameplay. Athletes can compete in wheelchair or standing categories depending on their classification, training upper body muscles, flexibility, and rapid spatial awareness."
    },
    icon: "🏸",
    dbName: "Cầu lông"
  },
  "ban-cung": { 
    vi: {
      name: "Bắn cung",
      desc: "Bộ môn bắn cung trợ năng rèn luyện tâm lý vững vàng, kỹ thuật giương cung tĩnh lặng.",
      detailDesc: "Bắn cung người khuyết tật (Para Archery) yêu cầu kỹ thuật kéo dây cung ổn định, khả năng điều hòa hơi thở và giữ tâm lý bình tĩnh tuyệt đối. Hỗ trợ các thiết bị trợ năng giá đỡ cung hoặc ngắm bắn bằng răng dành cho VĐV khuyết tật tay."
    },
    en: {
      name: "Archery",
      desc: "Assistive archery training stable mental focus and quiet drawing technique.",
      detailDesc: "Para Archery requires a stable bowstring draw technique, controlled breathing, and absolute calmness. Assistive devices like bow stands or mouth tabs are supported for arm-disabled athletes."
    },
    icon: "🏹",
    dbName: "Bắn cung"
  }
};

const translations: Record<string, Record<string, string>> = {
  vi: {
    back: "Quay lại",
    goHome: "Quay về Trang chủ",
    notFound: "Không tìm thấy bộ môn thể thao này",
    loading: "Đang tải...",
    newsTitle: "Tin tức & Sự kiện nổi bật",
    noNews: "Hiện tại chưa có tin tức nào về bộ môn này.",
    newsCategory: "Tin tức",
    coursesTitle: "Khóa học & Bài tập tập luyện",
    noCourses: "Chưa có bài tập chuyên biệt cho môn này.",
    learnMore: "Học bài giảng →",
    clubsTitle: "Câu lạc bộ tập luyện",
    allClubs: "Xem tất cả CLB →",
    noClubs: "Hiện chưa có câu lạc bộ {sport} nào chờ phê duyệt hiển thị.",
    schedule: "Lịch tập",
    sportTitle: "Bộ môn",
  },
  en: {
    back: "Back",
    goHome: "Back to Home",
    notFound: "Sport category not found",
    loading: "Loading...",
    newsTitle: "Featured News & Events",
    noNews: "There is currently no news available for this sport.",
    newsCategory: "News",
    coursesTitle: "Courses & Workouts",
    noCourses: "No specialized exercises available for this sport yet.",
    learnMore: "Learn Lesson →",
    clubsTitle: "Training Clubs",
    allClubs: "View all Clubs →",
    noClubs: "No {sport} clubs are currently available.",
    schedule: "Schedule",
    sportTitle: "Sport",
  }
};

export default function SportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { language } = useLanguage();
  
  const t = translations[language] || translations.vi;

  const [sportInfo, setSportInfo] = useState<{
    name: string;
    icon: string;
    desc: string;
    detailDesc: string;
    dbName: string;
  } | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [tournamentList, setTournamentList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  
  const [newsPage, setNewsPage] = useState(1);
  const postsPerPage = 5;

  useEffect(() => {
    const fetchSportInfoAndData = async () => {
      setLoading(true);
      try {
        // Fetch sport detail by slug from backend API
        const sportRes = await apiClient.request(`/sports/slug/${slug}`);
        let currentDbName = "";
        let sportId = "";

        if (sportRes.ok) {
          const sport = await sportRes.json();
          currentDbName = sport.nameVi;
          sportId = sport.id;
          setSportInfo({
            name: language === "vi" ? sport.nameVi : sport.nameEn,
            icon: sport.icon,
            desc: language === "vi" ? sport.descVi : sport.descEn,
            detailDesc: language === "vi" ? sport.detailDescVi : sport.detailDescEn,
            dbName: sport.nameVi
          });
        } else {
          // Fallback to hardcoded sportsMap
          const sportData = sportsMap[slug];
          if (sportData) {
            currentDbName = sportData.dbName;
            setSportInfo({
              name: language === "vi" ? sportData.vi.name : sportData.en.name,
              icon: sportData.icon,
              desc: language === "vi" ? sportData.vi.desc : sportData.en.desc,
              detailDesc: language === "vi" ? sportData.vi.detailDesc : sportData.en.detailDesc,
              dbName: sportData.dbName
            });
          } else {
            setSportInfo(null);
            setLoading(false);
            return;
          }
        }

        // Fetch related data
        if (currentDbName) {
          // Fetch posts
          const postsRes = await apiClient.request("/posts?take=1000");
          const postsData = postsRes.ok ? await postsRes.json() : [];
          const filteredPosts = postsData.filter((post: any) => {
            const text = `${post.title} ${post.excerpt || ""} ${post.content || ""} ${post.category?.name || ""}`.toLowerCase();
            return text.includes(currentDbName.toLowerCase());
          });
          setPosts(filteredPosts);

          // Fetch courses
          const coursesRes = await apiClient.request("/courses");
          const coursesData = coursesRes.ok ? await coursesRes.json() : [];
          const filteredCourses = coursesData.filter((course: any) => {
            const text = `${course.title} ${course.description}`.toLowerCase();
            const matches = text.includes(currentDbName.toLowerCase()) || 
                            (currentDbName === "Cử tạ" && text.includes("phục hồi")) ||
                            (currentDbName === "Bơi lội" && text.includes("dinh dưỡng")) ||
                            (currentDbName === "Điền kinh" && text.includes("phục hồi")) ||
                            (currentDbName === "Bóng bàn" && text.includes("dinh dưỡng")) ||
                            (currentDbName === "Cầu lông" && text.includes("dinh dưỡng")) ||
                            (currentDbName === "Bắn cung" && text.includes("dinh dưỡng"));
            return matches;
          });
          setCourses(filteredCourses);

          // Fetch clubs
          const clubsRes = await apiClient.request(`/organizations?sport=${encodeURIComponent(currentDbName)}`);
          const clubsData = clubsRes.ok ? await clubsRes.json() : [];
          setClubs(clubsData);

          // Fetch matches, rankings, tournaments using API sport ID
          if (sportId) {
            const [mRes, rRes, tRes] = await Promise.all([
              apiClient.request(`/matches?sportId=${sportId}&limit=5`),
              apiClient.request(`/rankings/sport/${sportId}`),
              apiClient.request(`/tournaments?sportId=${sportId}&limit=3`),
            ]);
            if (mRes.ok) { const d = await mRes.json(); setMatches(d.data || d || []); }
            if (rRes.ok) { const d = await rRes.json(); setRankings(Array.isArray(d) ? d.slice(0, 5) : []); }
            if (tRes.ok) { const d = await tRes.json(); setTournamentList(d.data || d || []); }
          }
        }
      } catch (err) {
        console.error("Failed to fetch sport details data:", err);
        // Fallback to hardcoded sportsMap in case of network/fetch failure
        const sportData = sportsMap[slug];
        if (sportData) {
          setSportInfo({
            name: language === "vi" ? sportData.vi.name : sportData.en.name,
            icon: sportData.icon,
            desc: language === "vi" ? sportData.vi.desc : sportData.en.desc,
            detailDesc: language === "vi" ? sportData.vi.detailDesc : sportData.en.detailDesc,
            dbName: sportData.dbName
          });
        } else {
          setSportInfo(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSportInfoAndData();
  }, [slug, language]);

  if (!loading && !sportInfo) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <h1 className="text-2xl font-bold mb-4">{t.notFound}</h1>
        <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer">
          <ArrowLeft size={16} /> {t.goHome}
        </button>
      </main>
    );
  }

  if (loading && !sportInfo) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">{t.loading}</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-300">

      <div className="max-w-6xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-extrabold mb-4">Bộ môn thể thao</h1>
        <div className="mb-12">
          <SportsCarousel />
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse py-12">
            <div className="md:col-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            <div className="h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cột trái (2/3): Tin tức & Sự kiện liên quan */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
                <Newspaper className="text-blue-500" />
                {t.newsTitle}
              </h2>

              {posts.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center shadow-md">
                  <p className="text-slate-500 dark:text-slate-400">{t.noNews}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.slice((newsPage - 1) * postsPerPage, newsPage * postsPerPage).map((post) => (
                    <article key={post.id} className="group glass-card p-5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col sm:flex-row gap-5">
                      <div className="w-full sm:w-44 h-32 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 relative">
                        {post.thumbnail ? (
                          <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">Không có ảnh</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none"></div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {post.category?.name || t.newsCategory}
                          </span>
                          <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-white line-clamp-2 hover:text-blue-600 transition">
                            <Link href={`/news/${post.slug}`}>
                              {post.title}
                            </Link>
                          </h3>
                          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-3">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{new Date(post.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                  
                  {/* Pagination Controls */}
                  {posts.length > postsPerPage && (() => {
                    const totalPages = Math.ceil(posts.length / postsPerPage);
                    return (
                      <div className="flex justify-center mt-8 pt-4">
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm">
                          {/* First Page */}
                          <button
                            disabled={newsPage === 1}
                            onClick={() => setNewsPage(1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
                          >
                            <ChevronsLeft size={16} />
                          </button>
                          
                          {/* Previous Page */}
                          <button
                            disabled={newsPage === 1}
                            onClick={() => setNewsPage(prev => prev - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          
                          {/* Page Numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                            if (page === 1 || page === totalPages || (page >= newsPage - 1 && page <= newsPage + 1)) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setNewsPage(page)}
                                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition cursor-pointer ${
                                    newsPage === page 
                                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === newsPage - 2 || page === newsPage + 2) {
                              return <span key={page} className="text-slate-400 px-1">...</span>;
                            }
                            return null;
                          })}

                          {/* Next Page */}
                          <button
                            disabled={newsPage === totalPages}
                            onClick={() => setNewsPage(prev => prev + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
                          >
                            <ChevronRight size={16} />
                          </button>
                          
                          {/* Last Page */}
                          <button
                            disabled={newsPage === totalPages}
                            onClick={() => setNewsPage(totalPages)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
                          >
                            <ChevronsRight size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Cột phải (1/3): Khóa học & Bài tập */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
                <GraduationCap className="text-indigo-500" />
                {t.coursesTitle}
              </h2>

              {courses.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center shadow-md">
                  <p className="text-slate-500 dark:text-slate-400">{t.noCourses}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {courses.map((course) => (
                    <article key={course.id} className="group glass-card overflow-hidden rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
                      <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">Không có ảnh</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent pointer-events-none"></div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white/40 dark:bg-slate-900/40">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 hover:text-indigo-600 transition">
                          <Link href={`/creator-lab/courses/${course.slug}`}>
                            {course.title}
                          </Link>
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {(course.description || "").replace(/<[^>]+>/g, '')}
                        </p>
                        <Link href={`/creator-lab/courses/${course.slug}`} className="block text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/40 dark:border-indigo-900/30 py-2 rounded-xl hover:bg-indigo-100 transition active:scale-95 cursor-pointer">
                          {t.learnMore}
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Section: Câu lạc bộ năng khiếu */}
        {!loading && (
          <section className="space-y-6 mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Trophy className="text-amber-500" />
                {t.clubsTitle} {sportInfo?.name}
              </h2>
              <Link href={`/clubs?sport=${encodeURIComponent(sportInfo?.dbName || "")}`} className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition">
                {t.allClubs}
              </Link>
            </div>

            {clubs.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center shadow-md">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.noClubs.replace("{sport}", sportInfo?.name || "")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {clubs.map((club) => (
                  <div key={club.id} className="glass-card p-5 rounded-2xl shadow-sm border flex flex-col justify-between group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-blue-600 transition line-clamp-1">{club.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <MapPin size={12} className="text-blue-500 shrink-0" />
                        <span className="truncate">{club.location}</span>
                      </p>
                      <p className="text-xs text-slate-500">{t.schedule}: {club.schedule}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Matches Section */}
        {matches.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> {language === "vi" ? "Trận đấu gần đây" : "Recent Matches"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matches.slice(0, 4).map((m: any) => (
                <Link key={m.id} href={`/matches/${m.id}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 hover:shadow-md transition">
                  <p className="text-sm font-bold truncate">{m.title}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{m.status}</span>
                    {m.startTime && <span>{new Date(m.startTime).toLocaleDateString()}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Rankings Section */}
        {rankings.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-500" /> {language === "vi" ? "Bảng xếp hạng" : "Rankings"}
            </h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {rankings.map((r: any, i: number) => (
                <div key={r.id || i} className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm font-bold w-8 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                  <span className="text-sm font-semibold flex-1">{r.athlete?.user?.fullName || r.team?.name || "—"}</span>
                  {r.points > 0 && <span className="text-xs text-slate-400">{r.points} pts</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tournaments Section */}
        {tournamentList.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-purple-500" /> {language === "vi" ? "Giải đấu" : "Tournaments"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tournamentList.map((t: any) => (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition">
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{t.location}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t.status}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

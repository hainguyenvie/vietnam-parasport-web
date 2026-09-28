"use client";

import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, CheckCircle2, AlertCircle, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/components/SettingsProvider";
import { toast } from "sonner";
import { SocialLinksAdmin } from "@/components/admin/SocialLinksAdmin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";

// next/image available for migration — add unoptimized for dynamic URLs

interface CarouselItem {
  url: string;
  title: string;
  link: string;
}

export function SettingsTab() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { refreshSettings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  
  const [currentLogo, setCurrentLogo] = useState("");
  const [currentFavicon, setCurrentFavicon] = useState("");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [savingNav, setSavingNav] = useState(false);
  const [uploadingCarousel, setUploadingCarousel] = useState(false);
  
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  
  const [heroContent, setHeroContent] = useState({ titleVi: "", titleEn: "", descVi: "", descEn: "" });
  const [heroShowContent, setHeroShowContent] = useState<boolean>(true);
  const [footerContent, setFooterContent] = useState({ aboutVi: "", aboutEn: "", addressVi: "", addressEn: "", phone: "", email: "" });
  const [headerColor, setHeaderColor] = useState("");
  const [footerColor, setFooterColor] = useState("");
  const [headerTextColor, setHeaderTextColor] = useState("");
  const [footerTextColor, setFooterTextColor] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [siteTitle, setSiteTitle] = useState<string>("");
  const [savingSiteTitle, setSavingSiteTitle] = useState(false);

  const defaultMenuOrder = [
    { id: 'about', name: 'Về chúng tôi' },
    { id: 'sports', name: 'Bộ môn' },
    { id: 'matches', name: 'Lịch thi đấu' },
    { id: 'rankings', name: 'BXH' },
    { id: 'creator-lab', name: 'Creator Lab' },
    { id: 'news', name: 'Tin tức & Sự kiện' },
    { id: 'clubs', name: 'Câu lạc bộ' },
    { id: 'companion', name: 'Đồng hành' }
  ];
  const [menuOrder, setMenuOrder] = useState<string[]>(defaultMenuOrder.map(m => m.id));
  const [menuVisibility, setMenuVisibility] = useState<Record<string, boolean>>({});
  const [draggedMenuIndex, setDraggedMenuIndex] = useState<number | null>(null);

  const defaultAdminSidebarOrder = [
    { id: '/admin', name: 'Tổng quan' },
    { id: '/admin/users', name: 'Người dùng' },
    { id: '/admin/posts', name: 'Tin tức' },
    { id: '/admin/creator-lab', name: 'Creator Lab' },
    { id: '/admin/organizations', name: 'Câu lạc bộ' },
    { id: '/admin/teams', name: 'Đội tuyển' },
    { id: '/admin/companion', name: 'Yêu cầu đồng hành' },
    { id: '/admin/partners', name: 'Đối tác & Tài trợ' },
    { id: '/admin/sports', name: 'Quản lý Bộ môn' },
    { id: '/admin/disability-classes', name: 'Hạng thương tật' },
    { id: '/admin/tournaments', name: 'Giải đấu' },
    { id: '/admin/events', name: 'Sự kiện' },
    { id: '/admin/audit-logs', name: 'Nhật ký hệ thống' },
    { id: '/admin/email-templates', name: 'Email Templates' },
    { id: '/admin/commissions', name: 'Hoa hồng' },
    { id: '/admin/affiliates', name: 'Affiliates' },
    { id: '/admin/assistants', name: 'Hỗ trợ viên' },
    { id: '/admin/marketplace', name: 'Marketplace' },
    { id: '/admin/settings', name: 'Cài đặt hệ thống' },
  ];

  // Map old short-name format to URL paths (backward compatibility with pre-fix seed data)
  const shortNameToUrlPath: Record<string, string> = {
    'dashboard': '/admin',
    'users': '/admin/users',
    'posts': '/admin/posts',
    'courses': '/admin/creator-lab',
    'organizations': '/admin/organizations',
    'teams': '/admin/teams',
    'companion': '/admin/companion',
    'partners': '/admin/partners',
    'sports': '/admin/sports',
    'tournaments': '/admin/tournaments',
    'events': '/admin/events',
    'marketplace': '/admin/marketplace',
    'affiliates': '/admin/affiliates',
    'commissions': '/admin/commissions',
    'assistants': '/admin/assistants',
    'documents': '/admin/creator-lab',
    'email-templates': '/admin/email-templates',
    'settings': '/admin/settings',
    'audit-logs': '/admin/audit-logs',
  };

  function normalizeSidebarIds(ids: string[]): string[] {
    // Convert old short names to URL paths, deduplicate, and keep only known entries
    const urlPathSet = new Set(defaultAdminSidebarOrder.map(m => m.id));
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of ids) {
      const normalized = id.startsWith('/admin/') ? id : (shortNameToUrlPath[id] || null);
      if (normalized && urlPathSet.has(normalized) && !seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    }
    // Append any items from defaults that aren't already included (e.g., new items added after seeding)
    for (const item of defaultAdminSidebarOrder) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item.id);
      }
    }
    return result;
  }

  function normalizeSidebarVisibility(vis: Record<string, boolean>): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(vis)) {
      const normalized = key.startsWith('/admin/') ? key : (shortNameToUrlPath[key] || null);
      if (normalized) {
        result[normalized] = value;
      }
    }
    // Ensure all default items have a visibility entry
    for (const item of defaultAdminSidebarOrder) {
      if (!(item.id in result)) {
        result[item.id] = true;
      }
    }
    return result;
  }
  const [adminSidebarOrder, setAdminSidebarOrder] = useState<string[]>(defaultAdminSidebarOrder.map(m => m.id));
  const [adminSidebarVisibility, setAdminSidebarVisibility] = useState<Record<string, boolean>>({});
  const [draggedAdminSidebarIndex, setDraggedAdminSidebarIndex] = useState<number | null>(null);

  const [showPartners, setShowPartners] = useState<boolean>(true);
  const [savingPartners, setSavingPartners] = useState(false);

  const [heroBannerSize, setHeroBannerSize] = useState<string>("large");
  const [heroImageFit, setHeroImageFit] = useState<string>("cover");

  const [activeTab, setActiveTab] = useState<'brand' | 'navigation' | 'home'>('brand');
  const apiUrl = getApiUrl('/');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.push("/");
      } else {
        fetchSettings();
      }
    }
  }, [status, session, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/settings`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        }
      });
      if (res.ok) {
        const envelope = await res.json();
        const data = envelope?.data || envelope;
        if (data.siteTitle) setSiteTitle(data.siteTitle);
        if (data.logoPath) setCurrentLogo(`/${data.logoPath.replace(/^\/+/, '')}`);
        if (data.faviconPath) setCurrentFavicon(`/${data.faviconPath.replace(/^\/+/, '')}`);
        if (data.HERO_CAROUSEL && Array.isArray(data.HERO_CAROUSEL)) {
          setCarouselItems(data.HERO_CAROUSEL);
        }
        if (data.HERO_CONTENT) setHeroContent(data.HERO_CONTENT);
        if (data.HERO_SHOW_CONTENT !== undefined) setHeroShowContent(data.HERO_SHOW_CONTENT !== false);
        if (data.FOOTER_CONTENT) setFooterContent(data.FOOTER_CONTENT);
        if (data.HEADER_MENU_ORDER && Array.isArray(data.HEADER_MENU_ORDER)) {
          setMenuOrder(data.HEADER_MENU_ORDER);
        }
        if (data.HEADER_MENU_VISIBILITY) {
          setMenuVisibility(data.HEADER_MENU_VISIBILITY);
        }
        if (data.ADMIN_SIDEBAR_ORDER && Array.isArray(data.ADMIN_SIDEBAR_ORDER)) {
          setAdminSidebarOrder(normalizeSidebarIds(data.ADMIN_SIDEBAR_ORDER));
        }
        if (data.ADMIN_SIDEBAR_VISIBILITY) {
          setAdminSidebarVisibility(normalizeSidebarVisibility(data.ADMIN_SIDEBAR_VISIBILITY));
        }
        if (data.SHOW_PARTNERS !== undefined) {
          setShowPartners(data.SHOW_PARTNERS !== false);
        }
        if (data.HERO_BANNER_SIZE) setHeroBannerSize(data.HERO_BANNER_SIZE);
        if (data.HERO_IMAGE_FIT) setHeroImageFit(data.HERO_IMAGE_FIT);
        if (data.HEADER_COLOR) setHeaderColor(data.HEADER_COLOR);
        if (data.FOOTER_COLOR) setFooterColor(data.FOOTER_COLOR);
        if (data.HEADER_TEXT_COLOR) setHeaderTextColor(data.HEADER_TEXT_COLOR);
        if (data.FOOTER_TEXT_COLOR) setFooterTextColor(data.FOOTER_TEXT_COLOR);
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối máy chủ khi lấy cài đặt.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSiteTitle = async () => {
    setSavingSiteTitle(true);
    try {
      const res = await fetch(`${apiUrl}/settings/admin/generic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ key: "siteTitle", value: siteTitle })
      });
      if (res.ok) {
        toast.success("Đã lưu tiêu đề trang web.");
        await refreshSettings();
      } else {
        toast.error("Lưu tiêu đề thất bại.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setSavingSiteTitle(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);

    const formData = new FormData();
    formData.append("file", logoFile);

    try {
      const res = await fetch(`${apiUrl}/settings/admin/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentLogo(`/${(data.data?.value || data.value || '').replace(/^\/+/, '')}`);
        toast.success("Tải logo lên thành công.");
        setLogoFile(null);
        await refreshSettings();
      } else {
        toast.error("Tải logo thất bại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadFavicon = async () => {
    if (!faviconFile) return;
    setUploadingFavicon(true);

    const formData = new FormData();
    formData.append("file", faviconFile);

    try {
      const res = await fetch(`${apiUrl}/settings/admin/favicon`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentFavicon(`/${(data.data?.value || data.value || '').replace(/^\/+/, '')}`);
        toast.success("Tải favicon lên thành công.");
        setFaviconFile(null);
        await refreshSettings();
      } else {
        toast.error("Tải favicon thất bại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleSaveBrand = async () => {
    setSavingBrand(true);
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.accessToken}` };
      const body = (key: string, value: any) => JSON.stringify({ key, value });

      const [headerRes, footerRes, headerTextRes, footerTextRes] = await Promise.all([
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HEADER_COLOR", headerColor) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("FOOTER_COLOR", footerColor) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HEADER_TEXT_COLOR", headerTextColor) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("FOOTER_TEXT_COLOR", footerTextColor) }),
      ]);

      if (headerRes.ok && footerRes.ok && headerTextRes.ok && footerTextRes.ok) {
        toast.success("Lưu màu sắc thương hiệu thành công.");
        await refreshSettings();
      } else {
        toast.error("Có lỗi khi lưu màu sắc thương hiệu.");
      }
    } catch (err) { console.error(err); toast.error("Lỗi kết nối."); }
    finally { setSavingBrand(false); }
  };

  const handleUploadCarouselImages = async (files: FileList) => {
    setUploadingCarousel(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`${apiUrl}/settings/admin/generic-upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setCarouselItems(prev => [...prev, { url: data.data?.url || data.url, title: "", link: "" }]);
          successCount++;
        }
      } catch (err) { console.error(err); }
    }
    if (successCount > 0) toast.success(`Đã tải lên ${successCount} ảnh.`);
    setUploadingCarousel(false);
  };

  const handleSaveHomepage = async () => {
    setSavingHome(true);
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.accessToken}` };
      const body = (key: string, value: any) => JSON.stringify({ key, value });

      const [carousel, banner, fit, hero, footer, showContentRes] = await Promise.all([
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HERO_CAROUSEL", carouselItems) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HERO_BANNER_SIZE", heroBannerSize) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HERO_IMAGE_FIT", heroImageFit) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HERO_CONTENT", heroContent) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("FOOTER_CONTENT", footerContent) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HERO_SHOW_CONTENT", heroShowContent) }),
      ]);

      if (carousel.ok && banner.ok && fit.ok && hero.ok && footer.ok && showContentRes.ok) {
        toast.success("Lưu cấu hình Trang chủ thành công.");
        await refreshSettings();
      } else {
        toast.error("Có lỗi khi lưu một số cấu hình.");
      }
    } catch (err) { console.error(err); toast.error("Lỗi kết nối."); }
    finally { setSavingHome(false); }
  };

  const moveMenuUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...menuOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setMenuOrder(newOrder);
  };

  const moveMenuDown = (index: number) => {
    if (index === menuOrder.length - 1) return;
    const newOrder = [...menuOrder];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setMenuOrder(newOrder);
  };

  const handleDragMenuStart = (index: number) => {
    setDraggedMenuIndex(index);
  };

  const handleDragMenuOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDropMenu = (index: number) => {
    if (draggedMenuIndex === null || draggedMenuIndex === index) return;
    const newOrder = [...menuOrder];
    const draggedItem = newOrder.splice(draggedMenuIndex, 1)[0];
    newOrder.splice(index, 0, draggedItem);
    setMenuOrder(newOrder);
    setDraggedMenuIndex(null);
  };

  const handleSaveNavigation = async () => {
    setSavingNav(true);
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.accessToken}` };
      const body = (key: string, value: any) => JSON.stringify({ key, value });

      const [headerOrder, headerVis, sidebarOrder, sidebarVis] = await Promise.all([
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HEADER_MENU_ORDER", menuOrder) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("HEADER_MENU_VISIBILITY", menuVisibility) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("ADMIN_SIDEBAR_ORDER", adminSidebarOrder) }),
        fetch(`${apiUrl}/settings/admin/generic`, { method: "POST", headers, body: body("ADMIN_SIDEBAR_VISIBILITY", adminSidebarVisibility) }),
      ]);

      if (headerOrder.ok && headerVis.ok && sidebarOrder.ok && sidebarVis.ok) {
        toast.success("Lưu cấu hình Điều hướng thành công.");
        await refreshSettings();
      } else {
        toast.error("Có lỗi khi lưu cấu hình Điều hướng.");
      }
    } catch (err) { console.error(err); toast.error("Lỗi kết nối."); }
    finally { setSavingNav(false); }
  };

  const moveAdminSidebarUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...adminSidebarOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setAdminSidebarOrder(newOrder);
  };

  const moveAdminSidebarDown = (index: number) => {
    if (index === adminSidebarOrder.length - 1) return;
    const newOrder = [...adminSidebarOrder];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setAdminSidebarOrder(newOrder);
  };

  const handleDragAdminSidebarStart = (index: number) => {
    setDraggedAdminSidebarIndex(index);
  };

  const handleDropAdminSidebar = (index: number) => {
    if (draggedAdminSidebarIndex === null || draggedAdminSidebarIndex === index) return;
    const newOrder = [...adminSidebarOrder];
    const draggedItem = newOrder.splice(draggedAdminSidebarIndex, 1)[0];
    newOrder.splice(index, 0, draggedItem);
    setAdminSidebarOrder(newOrder);
    setDraggedAdminSidebarIndex(null);
  };

  const handleSaveShowPartners = async (newValue: boolean) => {
    setSavingPartners(true);
    setShowPartners(newValue);
    try {
      const res = await fetch(`${apiUrl}/settings/admin/generic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ key: "SHOW_PARTNERS", value: newValue })
      });

      if (res.ok) {
        toast.success(newValue ? "Đã bật hiển thị đối tác." : "Đã tắt hiển thị đối tác.");
        await refreshSettings();
      } else {
        toast.error("Lưu cấu hình đối tác thất bại.");
        setShowPartners(!newValue); // revert
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
      setShowPartners(!newValue); // revert
    } finally {
      setSavingPartners(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl w-fit mb-8 border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
        <button
          onClick={() => setActiveTab('brand')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${activeTab === 'brand' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm scale-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}
        >
          Thương hiệu
        </button>
        <button
          onClick={() => setActiveTab('navigation')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${activeTab === 'navigation' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm scale-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}
        >
          Điều hướng
        </button>
        <button
          onClick={() => setActiveTab('home')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${activeTab === 'home' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm scale-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}
        >
          Trang chủ
        </button>
      </div>

      {activeTab === 'brand' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Brand Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Site Title Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Tiêu đề trang web (Site Title)</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="VD: Việt Nam Paralympic Sport"
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={handleSaveSiteTitle}
              disabled={savingSiteTitle}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {savingSiteTitle ? "Đang lưu..." : "Lưu tiêu đề"}
            </button>
          </div>
          <p className="text-xs text-slate-500">Tiêu đề này sẽ hiển thị trên thanh tiêu đề của trình duyệt và trong kết quả tìm kiếm.</p>
        </div>

        {/* Logo Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Logo Website</h2>
          
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 relative group min-h-[200px]">
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="max-h-32 object-contain" />
            ) : currentLogo ? (
              <img src={currentLogo} alt="Current Logo" className="max-h-32 object-contain" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-sm text-slate-500">Chưa có Logo</p>
              </div>
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-slate-500">Nhấp vào khung để chọn file ảnh mới.</p>
            <button
              onClick={handleUploadLogo}
              disabled={!logoFile || uploadingLogo}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {uploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Cập nhật Logo
            </button>
          </div>
        </div>

        {/* Favicon Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Favicon (Biểu tượng tab)</h2>
          
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 relative group min-h-[200px]">
            {faviconFile ? (
              <img src={URL.createObjectURL(faviconFile)} alt="Favicon Preview" className="w-16 h-16 object-contain" />
            ) : currentFavicon ? (
              <img src={currentFavicon} alt="Current Favicon" className="w-16 h-16 object-contain" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-sm text-slate-500">Chưa có Favicon</p>
              </div>
            )}
            
            <input 
              type="file" 
              accept=".ico,.png,.svg" 
              onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-slate-500">Định dạng hỗ trợ: .ico, .png, .svg</p>
            <button
              onClick={handleUploadFavicon}
              disabled={!faviconFile || uploadingFavicon}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {uploadingFavicon ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Cập nhật Favicon
            </button>
          </div>
        </div>
        </div>

        {/* Colors Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4 mt-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Màu sắc thương hiệu</h2>
          <p className="text-sm text-slate-500">Tùy chỉnh màu nền cho Header và Footer.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Màu nền Header</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={headerColor || "#dc2626"} 
                    onChange={(e) => setHeaderColor(e.target.value)}
                    className="w-12 h-12 p-1 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input 
                    type="text" 
                    value={headerColor} 
                    onChange={(e) => setHeaderColor(e.target.value)}
                    placeholder="#dc2626"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Màu chữ Header</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={headerTextColor || "#ffffff"} 
                    onChange={(e) => setHeaderTextColor(e.target.value)}
                    className="w-12 h-12 p-1 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input 
                    type="text" 
                    value={headerTextColor} 
                    onChange={(e) => setHeaderTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Màu nền Footer</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={footerColor || "#1e293b"} 
                    onChange={(e) => setFooterColor(e.target.value)}
                    className="w-12 h-12 p-1 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input 
                    type="text" 
                    value={footerColor} 
                    onChange={(e) => setFooterColor(e.target.value)}
                    placeholder="#1e293b"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Màu chữ Footer</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={footerTextColor || "#ffffff"} 
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    className="w-12 h-12 p-1 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input 
                    type="text" 
                    value={footerTextColor} 
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveBrand}
              disabled={savingBrand}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {savingBrand ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu Màu sắc
            </button>
          </div>
        </div>
        </div>
      )}

      {activeTab === 'navigation' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end">
            <button
              onClick={handleSaveNavigation}
              disabled={savingNav}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {savingNav ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu Điều hướng
            </button>
          </div>
          {/* Header Menu Order Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4">
        <div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Thứ tự Menu Header</h2>
            <p className="text-sm text-slate-500">Sắp xếp các mục hiển thị trên thanh điều hướng chính.</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {menuOrder.map((id, index) => {
            const menuItem = defaultMenuOrder.find(m => m.id === id);
            if (!menuItem) return null;
            const isVisible = menuVisibility[id] !== false; // Default to true if undefined
            return (
              <div 
                key={id} 
                draggable
                onDragStart={() => handleDragMenuStart(index)}
                onDragOver={handleDragMenuOver}
                onDrop={() => handleDropMenu(index)}
                className={`flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 cursor-move hover:bg-slate-100 dark:hover:bg-slate-800 transition ${draggedMenuIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-slate-400" />
                  <span className={`font-medium ${isVisible ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 line-through'}`}>{menuItem.name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Switch
                    checked={isVisible}
                    onCheckedChange={() => setMenuVisibility(prev => ({ ...prev, [id]: !isVisible }))}
                    aria-label={isVisible ? "Đang hiện" : "Đang ẩn"}
                  />
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <button
                    onClick={() => moveMenuUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveMenuDown(index)}
                    disabled={index === menuOrder.length - 1}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Sidebar Configuration Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4">
        <div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Thanh điều hướng Admin (Sidebar)</h2>
            <p className="text-sm text-slate-500">Sắp xếp thứ tự và ẩn/hiện các mục trên thanh Sidebar của trang quản trị.</p>
          </div>
        </div>

        <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-700">
          {adminSidebarOrder.map((id, index) => {
            const menuItem = defaultAdminSidebarOrder.find(m => m.id === id);
            if (!menuItem) return null;
            const isVisible = adminSidebarVisibility[id] !== false; // default true if not set

            return (
              <div 
                key={id} 
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                draggable
                onDragStart={() => handleDragAdminSidebarStart(index)}
                onDragOver={handleDragMenuOver}
                onDrop={() => handleDropAdminSidebar(index)}
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-slate-400 cursor-move" />
                  <span className={`font-medium ${isVisible ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 line-through'}`}>{menuItem.name}</span>
                  <span className="text-xs text-slate-400 font-mono ml-2">({id})</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Switch
                    checked={isVisible}
                    onCheckedChange={() => setAdminSidebarVisibility(prev => ({ ...prev, [id]: !isVisible }))}
                    aria-label={isVisible ? "Đang hiện" : "Đang ẩn"}
                  />
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <button
                    onClick={() => moveAdminSidebarUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveAdminSidebarDown(index)}
                    disabled={index === adminSidebarOrder.length - 1}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
        </div>
      )}

      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end">
            <button
              onClick={handleSaveHomepage}
              disabled={savingHome}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {savingHome ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu Trang chủ
            </button>
          </div>
          {/* Hero Carousel Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4">
        <div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Hero Slider (Trang chủ)</h2>
            <p className="text-sm text-slate-500">Quản lý các hình ảnh hiển thị ở banner đầu trang chủ.</p>
          </div>
        </div>

        <div className="space-y-4 mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="mb-2">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Tùy chọn hiển thị Banner</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Chiều cao Banner (% màn hình)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={heroBannerSize === 'large' ? '80' : heroBannerSize === 'small' ? '50' : heroBannerSize}
                  onChange={(e) => setHeroBannerSize(e.target.value)}
                  className="w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-500 text-sm">% (vh)</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Kiểu hiển thị ảnh</label>
              <select
                value={heroImageFit}
                onChange={(e) => setHeroImageFit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cover">Lấp đầy màn hình (Cover - có thể bị cắt xén)</option>
                <option value="contain">Vừa vặn khung hình (Contain - hiển thị toàn bộ ảnh)</option>
              </select>
            </div>
          </div>

          {/* New Toggle */}
          <div className="flex items-center justify-between mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="font-medium text-slate-800 dark:text-white">Hiển thị chữ và nút bấm trên Banner</h4>
              <p className="text-xs text-slate-500">Tắt nếu bạn đã có thiết kế chữ sẵn trên hình ảnh slider</p>
            </div>
            <Switch
              checked={heroShowContent}
              onCheckedChange={setHeroShowContent}
              aria-label="Hiển thị nội dung Hero"
            />
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {carouselItems.map((item, index) => (
            <div key={index} className="flex gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 items-start">
              <div className="mt-2 text-slate-400 cursor-move">
                <GripVertical size={20} />
              </div>
              <img src={item.url.startsWith("http") ? item.url : `/${item.url.startsWith('/') ? item.url.slice(1) : item.url}`} alt="Slide" className="w-32 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" />
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  placeholder="Tiêu đề (Tùy chọn)"
                  value={item.title}
                  onChange={(e) => {
                    const newItems = [...carouselItems];
                    newItems[index].title = e.target.value;
                    setCarouselItems(newItems);
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Đường dẫn liên kết (Tùy chọn)"
                  value={item.link}
                  onChange={(e) => {
                    const newItems = [...carouselItems];
                    newItems[index].link = e.target.value;
                    setCarouselItems(newItems);
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setCarouselItems(carouselItems.filter((_, i) => i !== index))}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition relative group min-h-[100px] cursor-pointer">
            <div className="text-center">
              <Plus className="mx-auto text-blue-500 mb-2" size={24} />
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Thêm ảnh vào Slider (có thể chọn nhiều ảnh)</p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleUploadCarouselImages(e.target.files);
              }}
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Additional Settings Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Cấu hình hiển thị</h2>
          <p className="text-sm text-slate-500">Tùy chỉnh bật/tắt các thành phần trên trang web.</p>
        </div>

        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="font-medium text-slate-800 dark:text-white">Hiển thị Đối tác Đồng hành & Tài trợ</h3>
            <p className="text-xs text-slate-500 mt-1">Bật để hiển thị dải đối tác ở chân trang chủ.</p>
          </div>
          <button
            onClick={() => handleSaveShowPartners(!showPartners)}
            disabled={savingPartners}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              showPartners ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showPartners ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Text Settings Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Nội dung văn bản (Hero & Footer)</h2>
            <p className="text-sm text-slate-500">Tùy chỉnh nội dung hiển thị ở các vị trí chính.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Hero Section (Trang chủ)</h3>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Tiêu đề (Tiếng Việt)</label>
              <input
                type="text"
                value={heroContent.titleVi}
                onChange={e => setHeroContent({ ...heroContent, titleVi: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Tiêu đề (Tiếng Anh)</label>
              <input
                type="text"
                value={heroContent.titleEn}
                onChange={e => setHeroContent({ ...heroContent, titleEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Mô tả (Tiếng Việt)</label>
              <textarea
                value={heroContent.descVi}
                onChange={e => setHeroContent({ ...heroContent, descVi: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Mô tả (Tiếng Anh)</label>
              <textarea
                value={heroContent.descEn}
                onChange={e => setHeroContent({ ...heroContent, descEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Footer</h3>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Giới thiệu ngắn (Tiếng Việt)</label>
              <textarea
                value={footerContent.aboutVi}
                onChange={e => setFooterContent({ ...footerContent, aboutVi: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Giới thiệu ngắn (Tiếng Anh)</label>
              <textarea
                value={footerContent.aboutEn}
                onChange={e => setFooterContent({ ...footerContent, aboutEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Địa chỉ (Tiếng Việt)</label>
              <input
                type="text"
                value={footerContent.addressVi}
                onChange={e => setFooterContent({ ...footerContent, addressVi: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Địa chỉ (Tiếng Anh)</label>
              <input
                type="text"
                value={footerContent.addressEn}
                onChange={e => setFooterContent({ ...footerContent, addressEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Số điện thoại</label>
              <input
                type="text"
                value={footerContent.phone}
                onChange={e => setFooterContent({ ...footerContent, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Email liên hệ</label>
              <input
                type="text"
                value={footerContent.email}
                onChange={e => setFooterContent({ ...footerContent, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      <SocialLinksAdmin />
        </div>
      )}
    </div>
  );
}

"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from '@/hooks/useTranslation';
import { useTheme } from "next-themes";
import { useModalStore } from "@/store/useModalStore";
import { 
  User, 
  BookOpen, 
  Clock, 
  Calendar, 
  Bookmark, 
  Settings, 
  Globe, 
  Sun, 
  Moon, 
  Loader2, 
  Save, 
  KeyRound, 
  Lock, 
  Image as ImageIcon,
  ArrowRight,
  Shield,
  LogOut,
  Eye,
  EyeOff,
  Camera,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  BarChart3,
  MessageSquare,
  Medal,
  Trophy,
  Target,
} from "lucide-react";
import { computeLevel, computeBadges } from "@/utils/profile-level";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import AthleteTab from "./AthleteTab";
import CoachTab from "./CoachTab";
import AssistantTab from "./AssistantTab";
import AffiliateTab from "./AffiliateTab";
import ProfileTab from "./ProfileTab";
import CoursesTab from "./CoursesTab";
import BookmarksTab from "./BookmarksTab";
import SettingsTab from "./SettingsTab";

import Image from 'next/image';

const translations: Record<string, Record<string, string>> = {
  vi: {
    dashboardTitle: "Bảng điều khiển tài khoản",
    profileTab: "Hồ sơ cá nhân",
    coursesTab: "Khóa học của tôi",
    bookmarksTab: "Bài viết đã lưu",
    settingsTab: "Cài đặt chung",
    
    fullName: "Họ và tên",
    email: "Địa chỉ Email",
    role: "Quyền hạn tài khoản",
    joinedDate: "Tham gia ngày",
    contactInfo: "Thông tin liên hệ",
    loadingProfile: "Đang tải thông tin tài khoản...",
    errorProfile: "Lỗi tải thông tin tài khoản hoặc phiên đăng nhập hết hạn.",
    loginBtn: "Đăng nhập lại",
    
    trainingOverview: "Tóm tắt tiến trình tập luyện",
    noCoursesOverview: "Bạn chưa tham gia khóa học nào.",
    exploreCourses: "Khóa học & Bài giảng đã tham gia",
    noCoursesTitle: "Chưa tham gia khóa học nào",
    noCoursesDesc: "Hãy đăng ký tham gia các khóa học hướng dẫn tập luyện hoặc các tài liệu hướng dẫn xây kênh từ Creator Lab.",
    browseCoursesBtn: "Tìm kiếm khóa học",
    lastUpdated: "Cập nhật",
    continueLearning: "Tiếp tục học",
    
    savedArticlesTitle: "Bài viết đã lưu trữ",
    noSavedArticlesTitle: "Chưa lưu bài viết nào",
    noSavedArticlesDesc: "Lưu lại các tin bài quan tâm từ mục Tin tức để tiện đọc lại bất kỳ lúc nào.",
    readNewsBtn: "Xem tin tức",
    savedOn: "Lưu",
    removeBtn: "Bỏ lưu",
    
    updatePersonalInfo: "Cập nhật thông tin cá nhân",
    updateAccountBtn: "Cập nhật tài khoản",
    
    changePasswordTitle: "Đổi mật khẩu đăng nhập",
    currentPassword: "Mật khẩu hiện tại",
    newPassword: "Mật khẩu mới",
    confirmNewPassword: "Xác nhận mật khẩu mới",
    updatePasswordBtn: "Cập nhật mật khẩu",
    
    customizeTitle: "Tùy chỉnh Giao diện & Ngôn ngữ",
    appTheme: "Giao diện ứng dụng",
    displayLang: "Ngôn ngữ hiển thị",
    themeLight: "Sáng",
    themeDark: "Tối",
    signOutBtn: "Đăng xuất",
    adminDashboardBtn: "Bảng quản trị",
    
    phoneNumber: "Số điện thoại",
    dob: "Ngày sinh",
    gender: "Giới tính",
    address: "Địa chỉ",
    bio: "Tiểu sử",
    genderMale: "Nam",
    genderFemale: "Nữ",
    genderOther: "Khác",

    twoFactorTitle: "Bảo mật hai lớp (2FA)",
    twoFactorDesc: "Bảo vệ tài khoản của bạn bằng cách yêu cầu mã xác thực mỗi khi đăng nhập.",
    twoFactorEnabled: "Đã kích hoạt bảo mật hai lớp",
    twoFactorDisabled: "Chưa kích hoạt bảo mật hai lớp",
    btnEnable2FA: "Kích hoạt 2FA",
    btnDisable2FA: "Hủy kích hoạt 2FA",
    setup2FAStep1: "1. Quét mã QR dưới đây bằng ứng dụng xác thực của bạn (Google Authenticator, v.v.):",
    setup2FAStep2: "2. Hoặc nhập mã khóa này thủ công:",
    setup2FAStep3: "3. Nhập mã 6 chữ số từ ứng dụng để xác nhận:",
    btnVerify2FA: "Xác minh & Kích hoạt",
    btnCancel2FA: "Hủy bỏ",
    
    // toast notifications
    toastProfileLoadErr: "Lỗi tải thông tin tài khoản.",
    toastProfileSuccess: "Cập nhật thông tin cá nhân thành công!",
    toastProfileFail: "Cập nhật thông tin thất bại.",
    toastPwdRequired: "Vui lòng nhập đầy đủ mật khẩu.",
    toastPwdConfirmFail: "Mật khẩu xác nhận không khớp.",
    toastPwdMinLength: "Mật khẩu mới phải có từ 6 ký tự.",
    toastPwdSuccess: "Thay đổi mật khẩu thành công!",
    toastPwdIncorrect: "Mật khẩu hiện tại không chính xác.",
    toastServerErr: "Lỗi kết nối máy chủ.",
    toastBookmarkRemoved: "Đã bỏ lưu bài viết.",
    toastBookmarkFail: "Thao tác thất bại.",
    toastLangVi: "Đã chuyển đổi ngôn ngữ sang Tiếng Việt.",
    toastLangEn: "Changed display language to English.",
    toastThemeLight: "Đã chuyển sang giao diện Sáng.",
    toastThemeDark: "Đã chuyển sang giao diện Tối.",
    toast2FAGenerateFail: "Lỗi tạo mã QR 2FA.",
    toast2FAEnableSuccess: "Đã kích hoạt bảo mật hai lớp thành công!",
    toast2FAEnableFail: "Mã xác thực không chính xác hoặc đã hết hạn.",
    toast2FADisableSuccess: "Đã hủy kích hoạt bảo mật hai lớp thành công!",
    toast2FADisableFail: "Hủy kích hoạt 2FA thất bại.",
  },
  en: {
    dashboardTitle: "Account Dashboard",
    profileTab: "User Profile",
    coursesTab: "My Courses",
    bookmarksTab: "Saved Posts",
    settingsTab: "General Settings",
    
    fullName: "Full Name",
    email: "Email Address",
    role: "Account Role",
    joinedDate: "Joined on",
    contactInfo: "Contact Information",
    loadingProfile: "Loading profile...",
    errorProfile: "Failed to load account profile or session expired.",
    loginBtn: "Sign In Again",
    
    trainingOverview: "Training Progress Summary",
    noCoursesOverview: "You haven't enrolled in any courses yet.",
    exploreCourses: "My Registered Courses & Lectures",
    noCoursesTitle: "No registered courses",
    noCoursesDesc: "Enroll in physical training courses or personal brand creation materials from Creator Lab.",
    browseCoursesBtn: "Browse Courses",
    lastUpdated: "Updated",
    continueLearning: "Continue Learning",
    
    savedArticlesTitle: "Saved Articles",
    noSavedArticlesTitle: "No saved articles yet",
    noSavedArticlesDesc: "Save articles of interest from the News section to read them later.",
    readNewsBtn: "Read News",
    savedOn: "Saved",
    removeBtn: "Remove",
    
    updatePersonalInfo: "Update Personal Info",
    updateAccountBtn: "Update Account",
    
    changePasswordTitle: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePasswordBtn: "Update Password",
    
    customizeTitle: "Theme & Language Customization",
    appTheme: "App Theme",
    displayLang: "Display Language",
    themeLight: "Light",
    themeDark: "Dark",
    signOutBtn: "Sign Out",
    adminDashboardBtn: "Admin Dashboard",
    
    phoneNumber: "Phone Number",
    dob: "Date of Birth",
    gender: "Gender",
    address: "Address",
    bio: "Biography",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",

    twoFactorTitle: "Two-Factor Authentication (2FA)",
    twoFactorDesc: "Secure your account by requiring an additional verification code when logging in.",
    twoFactorEnabled: "Two-Factor Authentication is enabled",
    twoFactorDisabled: "Two-Factor Authentication is disabled",
    btnEnable2FA: "Enable 2FA",
    btnDisable2FA: "Disable 2FA",
    setup2FAStep1: "1. Scan the QR code below using Google Authenticator or a similar app:",
    setup2FAStep2: "2. Or enter this secret key manually:",
    setup2FAStep3: "3. Enter the 6-digit code from the app to confirm:",
    btnVerify2FA: "Verify & Enable",
    btnCancel2FA: "Cancel",
    
    // toast notifications
    toastProfileLoadErr: "Failed to load account information.",
    toastProfileSuccess: "Personal information updated successfully!",
    toastProfileFail: "Failed to update profile.",
    toastPwdRequired: "Please enter all password fields.",
    toastPwdConfirmFail: "Confirm password does not match.",
    toastPwdMinLength: "New password must be at least 6 characters.",
    toastPwdSuccess: "Password changed successfully!",
    toastPwdIncorrect: "Current password is incorrect.",
    toastServerErr: "Server connection failed.",
    toastBookmarkRemoved: "Removed article from bookmarks.",
    toastBookmarkFail: "Failed to perform operation.",
    toastLangVi: "Đã chuyển đổi ngôn ngữ sang Tiếng Việt.",
    toastLangEn: "Changed display language to English.",
    toastThemeLight: "Changed display theme to Light.",
    toastThemeDark: "Changed display theme to Dark.",
    toast2FAGenerateFail: "Failed to generate 2FA QR code.",
    toast2FAEnableSuccess: "Two-factor authentication enabled successfully!",
    toast2FAEnableFail: "Invalid or expired verification code.",
    toast2FADisableSuccess: "Two-factor authentication disabled successfully!",
    toast2FADisableFail: "Failed to disable 2FA.",
  }
};

function UserDashboard() {
  const { data: session, status, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [now] = useState(() => Date.now());

  // User Profile State
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    address: "",
    bio: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 2FA Security State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorQrCode, setTwoFactorQrCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Password Update State
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [showCurPwd, setShowCurPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);

  // Role upgrade state
  const [upgradingAthlete, setUpgradingAthlete] = useState(false);
  const [upgradingCoach, setUpgradingCoach] = useState(false);

  // Enrolled Courses State
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [bookmarkPage, setBookmarkPage] = useState(1);
  const bookmarksPerPage = 4;

  // Language State
  const { language, setLanguage } = useLanguage();

  // Get current translation
  const tStr = translations[language] || translations.vi;

  const getIncompleteFields = () => {
    if (!profile) return [];
    const fields = [];
    if (!profile.fullName?.trim()) fields.push(language === "vi" ? "Họ tên" : "Full Name");
    if (!profile.phoneNumber?.trim()) fields.push(language === "vi" ? "Số điện thoại" : "Phone Number");
    if (!profile.dob) fields.push(language === "vi" ? "Ngày sinh" : "Date of Birth");
    if (!profile.gender) fields.push(language === "vi" ? "Giới tính" : "Gender");
    
    if (profile.athleteProfile) {
      if (!profile.athleteProfile?.organizationId) fields.push(language === "vi" ? "Đơn vị/CLB" : "Organization");
      if (!profile.athleteProfile?.classificationId) fields.push(language === "vi" ? "Hạng thương tật" : "Classification");
    }
    if (profile.coachProfile) {
      if (!profile.coachProfile?.sportId) fields.push(language === "vi" ? "Bộ môn huấn luyện" : "Sport");
      if (!profile.coachProfile?.specialty) fields.push(language === "vi" ? "Chuyên môn huấn luyện" : "Specialty");
      if (!profile.coachProfile?.certificateUrl) fields.push(language === "vi" ? "Chứng chỉ / Bằng cấp" : "Certificate Link");
    }
    if (profile.assistantProfile) {
      if (!profile.assistantProfile?.supportArea) fields.push(language === "vi" ? "Mảng hỗ trợ" : "Support Area");
      if (!profile.assistantProfile?.medicalCertUrl) fields.push(language === "vi" ? "Chứng chỉ y tế" : "Medical Certificate");
    }
    return fields;
  };

  const getTotalRequiredFields = () => {
    let total = 4; // fullName, phoneNumber, dob, gender
    if (profile?.athleteProfile) total += 2; // organizationId, classificationId
    if (profile?.coachProfile) total += 3; // sportId, specialty, certificateUrl
    if (profile?.assistantProfile) total += 2; // supportArea, medicalCertUrl
    return total;
  };

  const completenessScore = profile ? Math.round(((getTotalRequiredFields() - getIncompleteFields().length) / getTotalRequiredFields()) * 100) : 0;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfileData();
      fetchCoursesData();
      fetchBookmarksData();
      fetchStats();
      fetchActivity();
    }
  }, [status, session]);

  // Set default tab from query param
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab && ["profile", "athlete", "coach", "assistant", "affiliate", "courses", "bookmarks", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchProfileData = async () => {
    if (!(session as any)?.accessToken) return;
    try {
      const res = await apiClient.request("/users/me", {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.status === 401) {
        signOut({ callbackUrl: "/login" });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setProfileForm({
          fullName: data.fullName || "",
          phoneNumber: data.phoneNumber || "",
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : "",
          gender: data.gender || "",
          address: data.address || "",
          bio: data.bio || "",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error(tStr.toastProfileLoadErr);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesData = async () => {
    if (!(session as any)?.accessToken) return;
    try {
      const res = await apiClient.request("/course-progress", {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchBookmarksData = async () => {
    if (!(session as any)?.accessToken) return;
    try {
      const res = await apiClient.request("/bookmarks", {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const fetchStats = async () => {
    try { const res = await apiClient.request("/users/me/stats"); if (res.ok) setStats(await res.json()); } catch { /* silent */ }
  };

  const fetchActivity = async () => {
    try { const res = await apiClient.request("/users/me/activity?limit=8"); if (res.ok) setActivities(await res.json()); } catch { /* silent */ }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      toast.warning(language === "vi" ? "Vui lòng nhập họ và tên." : "Please enter your full name.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiClient.request("/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile((prev: any) => ({ ...prev, ...updated }));
        await updateSession({ name: profileForm.fullName });
        toast.success(tStr.toastProfileSuccess);
      } else {
        toast.error(tStr.toastProfileFail);
      }
    } catch (e) {
      console.error(e);
      toast.error(tStr.toastServerErr);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarClick = () => {
    const fileInput = document.getElementById("avatar-file-input");
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning(language === "vi" ? "Vui lòng chọn một file hình ảnh." : "Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.warning(language === "vi" ? "Dung lượng ảnh không được vượt quá 2MB." : "Image size must not exceed 2MB.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      if (!base64String) {
        setUploadingAvatar(false);
        return;
      }

      try {
        const res = await apiClient.request("/users/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
          body: JSON.stringify({ avatarUrl: base64String }),
        });

        if (res.ok) {
          const updated = await res.json();
          setProfile((prev: any) => ({ ...prev, avatarUrl: updated.avatarUrl }));
          await updateSession({ image: updated.avatarUrl });
          toast.success(language === "vi" ? "Cập nhật ảnh đại diện thành công!" : "Avatar updated successfully!");
        } else {
          toast.error(language === "vi" ? "Cập nhật ảnh đại diện thất bại." : "Failed to update avatar.");
        }
      } catch (error) {
        console.error(error);
        toast.error(tStr.toastServerErr);
      } finally {
        setUploadingAvatar(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleCoverClick = () => {
    const fileInput = document.getElementById("cover-file-input");
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning(language === "vi" ? "Vui lòng chọn một file hình ảnh." : "Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.warning(language === "vi" ? "Dung lượng ảnh không được vượt quá 2MB." : "Image size must not exceed 2MB.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      try {
        const res = await apiClient.put("/users/me", { coverUrl: base64String });

        if (res.ok) {
          const updated = await res.json();
          setProfile((prev: any) => ({ ...prev, coverUrl: updated.coverUrl }));
          toast.success(language === "vi" ? "Cập nhật ảnh bìa thành công!" : "Cover image updated!");
        } else {
          toast.error(language === "vi" ? "Cập nhật ảnh bìa thất bại." : "Failed to update cover.");
        }
      } catch (error) {
        console.error(error);
        toast.error(tStr.toastServerErr);
      } finally {
        setUploadingAvatar(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleGenerate2FA = async () => {
    try {
      const res = await apiClient.request("/users/me/2fa/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorSecret(data.secret);
        setTwoFactorQrCode(data.qrCodeUrl);
        setShow2FASetup(true);
      } else {
        toast.error(tStr.toast2FAGenerateFail);
      }
    } catch (e) {
      console.error(e);
      toast.error(tStr.toastServerErr);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.warning(language === "vi" ? "Mã xác thực phải gồm 6 chữ số." : "Verification code must be 6 digits.");
      return;
    }

    setVerifying2FA(true);
    try {
      const res = await apiClient.request("/users/me/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          secret: twoFactorSecret,
          token: twoFactorCode,
        }),
      });

      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, isTwoFactorEnabled: true }));
        setShow2FASetup(false);
        setTwoFactorCode("");
        setTwoFactorSecret("");
        setTwoFactorQrCode("");
        toast.success(tStr.toast2FAEnableSuccess);
      } else {
        toast.error(tStr.toast2FAEnableFail);
      }
    } catch (e) {
      console.error(e);
      toast.error(tStr.toastServerErr);
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleUpgradeToAthlete = async () => {
    setUpgradingAthlete(true);
    try {
      const res = await apiClient.request("/users/me/upgrade-athlete", {
        method: "POST",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        toast.success(language === "vi" ? "Đăng ký thành Vận động viên thành công!" : "Registered as Athlete successfully!");
        await fetchProfileData(); // Reload profile data
      } else {
        toast.error(language === "vi" ? "Đăng ký thất bại." : "Registration failed.");
      }
    } catch (e) {
      console.error(e);
      toast.error(language === "vi" ? "Có lỗi xảy ra khi kết nối máy chủ." : "An error occurred connecting to server.");
    } finally {
      setUpgradingAthlete(false);
    }
  };

  const handleUpgradeToCoach = async () => {
    setUpgradingCoach(true);
    try {
      const res = await apiClient.request("/users/me/upgrade-coach", {
        method: "POST",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        toast.success(language === "vi" ? "Đăng ký thành Huấn luyện viên thành công!" : "Registered as Coach successfully!");
        await fetchProfileData(); // Reload profile data
      } else {
        toast.error(language === "vi" ? "Đăng ký thất bại." : "Registration failed.");
      }
    } catch (e) {
      console.error(e);
      toast.error(language === "vi" ? "Có lỗi xảy ra khi kết nối máy chủ." : "An error occurred connecting to server.");
    } finally {
      setUpgradingCoach(false);
    }
  };

  const handleDisable2FA = async () => {
    useModalStore.getState().openModal({
      type: "confirm",
      title: language === "vi" ? "Xác nhận hủy kích hoạt" : "Confirm Disable",
      description: language === "vi" ? "Bạn có chắc chắn muốn hủy kích hoạt bảo mật hai lớp?" : "Are you sure you want to disable two-factor authentication?",
      onConfirm: async () => {
        try {
          const res = await apiClient.request("/users/me/2fa/disable", {
            method: "POST",
            headers: { Authorization: `Bearer ${(session as any).accessToken}` },
          });

          if (res.ok) {
            setProfile((prev: any) => ({ ...prev, isTwoFactorEnabled: false }));
            toast.success(tStr.toast2FADisableSuccess);
          } else {
            toast.error(tStr.toast2FADisableFail);
          }
        } catch (e) {
          console.error(e);
          toast.error(tStr.toastServerErr);
        }
      }
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      toast.warning(tStr.toastPwdRequired);
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.warning(tStr.toastPwdConfirmFail);
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.warning(tStr.toastPwdMinLength);
      return;
    }

    setSavingPwd(true);
    try {
      const res = await apiClient.request("/users/me/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      });

      if (res.ok) {
        toast.success(tStr.toastPwdSuccess);
        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const err = await res.json();
        toast.error(err.message || tStr.toastPwdIncorrect);
      }
    } catch (e) {
      console.error(e);
      toast.error(tStr.toastServerErr);
    } finally {
      setSavingPwd(false);
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    try {
      const res = await apiClient.request("/bookmarks/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));
        toast.success(tStr.toastBookmarkRemoved);
      } else {
        toast.error(tStr.toastBookmarkFail);
      }
    } catch (e) {
      console.error(e);
      toast.error(tStr.toastServerErr);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as "vi" | "en");
    const msg = lang === "vi" ? translations.vi.toastLangVi : translations.en.toastLangEn;
    toast.success(msg);
  };

  const handleThemeChange = (nextTheme: string) => {
    setTheme(nextTheme);
    const msg = nextTheme === "light" ? tStr.toastThemeLight : tStr.toastThemeDark;
    toast.info(msg);
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  // Pagination helper
  const totalBookmarkPages = Math.ceil(bookmarks.length / bookmarksPerPage);
  const currentBookmarks = bookmarks.slice(
    (bookmarkPage - 1) * bookmarksPerPage,
    bookmarkPage * bookmarksPerPage
  );

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl py-12 space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-8 max-w-md text-center py-20">
        <p className="text-red-500 font-semibold mb-4">{tStr.errorProfile}</p>
        <Link href="/login" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold transition">{tStr.loginBtn}</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl py-12">

      {/* Alert Banner for Incomplete Profile */}
      {getIncompleteFields().length > 0 && (
        <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">
              {language === "vi" ? "⚠️ Hồ sơ của bạn chưa hoàn thiện!" : "⚠️ Your profile is incomplete!"}
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden max-w-xs">
                <div className="h-full bg-amber-600 rounded-full transition-all duration-500" style={{ width: `${completenessScore}%` }} />
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{completenessScore}%</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-350">
              {language === "vi"
                ? `Vui lòng bổ sung: ${getIncompleteFields().join(", ")}`
                : `Please provide: ${getIncompleteFields().join(", ")}`}
            </p>
          </div>
          <button 
            onClick={() => {
              if (profile.athleteProfile) changeTab("athlete");
              else if (profile.coachProfile) changeTab("coach");
              else if (profile.assistantProfile) changeTab("assistant");
              else changeTab("profile");
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition border-none cursor-pointer whitespace-nowrap active:scale-[0.98]"
          >
            {language === "vi" ? "Hoàn thiện ngay" : "Complete Now"}
          </button>
        </div>
      )}
      
      {/* User Hero Banner */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl shadow-blue-500/5 mb-8 transition-colors border border-slate-200/60 dark:border-slate-800/80">
        <div
          className="h-32 bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-855 relative overflow-hidden cursor-pointer group"
          style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          onClick={handleCoverClick}
        >
          {!profile.coverUrl && <div className="absolute inset-0 opacity-20 bg-grid-white/[0.08]"></div>}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
            <div className="flex flex-col items-center gap-1">
              <Camera size={20} className="text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {language === "vi" ? "Đổi ảnh bìa" : "Change cover"}
              </span>
            </div>
          </div>
          <input
            type="file"
            id="cover-file-input"
            className="hidden"
            accept="image/*"
            onChange={handleCoverChange}
            disabled={uploadingAvatar}
          />
        </div>
        <div className="px-6 md:px-8 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 relative">
            <div 
              onClick={handleAvatarClick}
              className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-lg shrink-0 cursor-pointer group relative"
              title={language === "vi" ? "Nhấp để đổi ảnh đại diện" : "Click to change avatar"}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              ) : (
                <User size={40} className="text-slate-400 dark:text-slate-500" />
              )}
              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                <Camera size={18} className="text-white mb-0.5" />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                  {uploadingAvatar ? "Đang tải..." : "Tải ảnh"}
                </span>
              </div>
              <input 
                type="file" 
                id="avatar-file-input" 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                disabled={uploadingAvatar}
              />
            </div>
            <div className="space-y-1 py-1">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{profile.fullName}</h1>
              {stats && (()=>{const l=computeLevel({achievementsGold:stats.goldMedals||0,achievementsSilver:stats.silverMedals||0,achievementsBronze:stats.bronzeMedals||0,coursesCompleted:stats.coursesCompleted||0,postsCount:stats.postsCount||0,affiliateTotalEarnings:stats.totalEarnings||0,accountAgeDays:stats.accountAge||0});const b=computeBadges({achievementsGold:stats.goldMedals||0,achievementsSilver:stats.silverMedals||0,achievementsBronze:stats.bronzeMedals||0,coursesCompleted:stats.coursesCompleted||0,postsCount:stats.postsCount||0,affiliateTotalEarnings:stats.totalEarnings||0,accountAgeDays:stats.accountAge||0,verifiedAchievements:stats.verifiedAchievements||0});return(<div className="space-y-2 mt-1"><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">{language==="vi"?"LV":"LV"} {l.level}</span><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-[200px]"><div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all" style={{width:`${l.xpProgress}%`}}/></div><span className="text-[10px] text-slate-400 font-semibold">{l.xpProgress}%</span></div><div className="flex gap-1.5 flex-wrap">{b.filter(x=>x.unlocked).slice(0,6).map(x=>(<span key={x.id} className="text-sm cursor-help" title={`${language==="vi"?x.nameVi:x.nameEn}: ${language==="vi"?x.descVi:x.descEn}`}>{x.icon}</span>))}{b.filter(x=>!x.unlocked).length>0&&(<span className="text-[10px] text-slate-400 self-center ml-1">+{b.filter(x=>!x.unlocked).length} {language==="vi"?"đã khóa":"locked"}</span>)}</div></div>)})()}
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar size={13} className="text-blue-500" /> {tStr.joinedDate} {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {((session?.user as any)?.role === 'SUPER_ADMIN' || (session?.user as any)?.role === 'ADMIN') && (
              <Link href="/admin" className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-800 border border-blue-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <Shield size={14} /> {tStr.adminDashboardBtn}
              </Link>
            )}
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-none"
            >
              <LogOut size={14} /> {tStr.signOutBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto gap-2 pb-0.5" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "profile"}
          onClick={() => changeTab("profile")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <User size={16} /> {tStr.profileTab}
        </button>

        {profile?.athleteProfile && (
          <button
            role="tab"
            aria-selected={activeTab === "athlete"}
            onClick={() => changeTab("athlete")}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "athlete"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Shield size={16} /> {language === "vi" ? "Hồ sơ VĐV" : "Athlete Profile"}
          </button>
        )}

        {profile?.coachProfile && (
          <button
            role="tab"
            aria-selected={activeTab === "coach"}
            onClick={() => changeTab("coach")}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "coach"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Shield size={16} /> {language === "vi" ? "Hồ sơ HLV" : "Coach Profile"}
          </button>
        )}

        {profile?.assistantProfile && (
          <button
            role="tab"
            aria-selected={activeTab === "assistant"}
            onClick={() => changeTab("assistant")}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "assistant"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Shield size={16} /> {language === "vi" ? "Hồ sơ Trợ lý" : "Assistant Profile"}
          </button>
        )}

        {profile?.athleteProfile && (
          <button
            role="tab"
            aria-selected={activeTab === "affiliate"}
            onClick={() => changeTab("affiliate")}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "affiliate"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <DollarSign size={16} /> {language === "vi" ? "Affiliate" : "Affiliate"}
          </button>
        )}

        <button
          role="tab"
          aria-selected={activeTab === "courses"}
          onClick={() => changeTab("courses")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "courses"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen size={16} /> {tStr.coursesTab}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "bookmarks"}
          onClick={() => changeTab("bookmarks")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "bookmarks"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Bookmark size={16} /> {tStr.bookmarksTab}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "settings"}
          onClick={() => changeTab("settings")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "settings"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Settings size={16} /> {tStr.settingsTab}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">

        {/* Tab 1: Profile Summary */}
        {activeTab === "profile" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Edit Profile Form */}
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md max-w-3xl mx-auto">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
                <Settings size={20} className="text-indigo-500" /> {tStr.updatePersonalInfo}
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.fullName}</label>
                    <div className="premium-input-wrapper">
                      <User className="premium-input-icon text-slate-400" size={18} />
                      <input
                        type="text"
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phoneNumber" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.phoneNumber}</label>
                    <div className="premium-input-wrapper">
                      <Phone className="premium-input-icon text-slate-400" size={18} />
                      <input
                        type="text"
                        id="phoneNumber"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="dob" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.dob}</label>
                    <div className="premium-input-wrapper">
                      <Calendar className="premium-input-icon text-slate-400" size={18} />
                      <input
                        type="date"
                        id="dob"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="gender" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.gender}</label>
                    <div className="premium-input-wrapper">
                      <User className="premium-input-icon text-slate-400" size={18} />
                      <select
                        id="gender"
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 bg-transparent pr-8 appearance-none"
                      >
                        <option value="" className="dark:bg-slate-800">{language === "vi" ? "-- Chọn giới tính --" : "-- Select Gender --"}</option>
                        <option value="MALE" className="dark:bg-slate-800">{tStr.genderMale}</option>
                        <option value="FEMALE" className="dark:bg-slate-800">{tStr.genderFemale}</option>
                        <option value="OTHER" className="dark:bg-slate-800">{tStr.genderOther}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="address" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.address}</label>
                    <div className="premium-input-wrapper">
                      <MapPin className="premium-input-icon text-slate-400" size={18} />
                      <input
                        type="text"
                        id="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="bio" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.bio}</label>
                    <div className="premium-input-wrapper">
                      <FileText className="premium-input-icon text-slate-400 top-3.5" size={18} />
                      <textarea
                        id="bio"
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 pl-11 py-2"
                        placeholder={language === "vi" ? "Viết một vài dòng giới thiệu bản thân..." : "Write a few lines introducing yourself..."}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="premium-btn px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-75 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 border-none"
                >
                  {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {tStr.updateAccountBtn}
                </button>
              </form>
            </div>

            {/* Stats Dashboard */}
            {stats && (
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white"><BarChart3 size={20} className="text-blue-500" />{language === "vi" ? "Thống kê hoạt động" : "Activity Stats"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-center"><BookOpen size={20} className="text-indigo-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.coursesCompleted}/{stats.coursesEnrolled}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Khóa học" : "Courses"}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-center"><FileText size={20} className="text-emerald-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.postsCount}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Bài viết" : "Posts"}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-center"><MessageSquare size={20} className="text-amber-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.commentsCount}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Bình luận" : "Comments"}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-center"><Clock size={20} className="text-purple-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.accountAge}d</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Ngày tham gia" : "Days Joined"}</p></div>
              </div>
              {stats.roleType === "athlete" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 text-center border border-amber-200 dark:border-amber-800"><Trophy size={20} className="text-amber-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">{stats.achievementsCount}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Thành tích" : "Achievements"}</p></div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl p-4 text-center border border-yellow-200 dark:border-yellow-800"><Medal size={20} className="text-yellow-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-yellow-700 dark:text-yellow-400">{stats.goldMedals}<span className="text-sm font-normal text-slate-400">/ {stats.silverMedals} / {stats.bronzeMedals}</span></p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "HC Vàng/Bạc/Đồng" : "G/S/B Medals"}</p></div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 text-center border border-blue-200 dark:border-blue-800"><Target size={20} className="text-blue-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{stats.tournamentsCount}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Giải đấu" : "Tournaments"}</p></div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-4 text-center border border-green-200 dark:border-green-800"><DollarSign size={20} className="text-green-500 mx-auto mb-2" /><p className="text-xl font-extrabold text-green-700 dark:text-green-400">{new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(stats.totalEarnings||0)}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Thu nhập" : "Earnings"}</p></div>
              </div>)}
              {stats.roleType === "coach" && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 text-center border border-blue-200 dark:border-blue-800"><Clock size={20} className="text-blue-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{stats.experienceYears}y</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Kinh nghiệm" : "Experience"}</p></div>
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl p-4 text-center border border-purple-200 dark:border-purple-800"><Target size={20} className="text-purple-500 mx-auto mb-2" /><p className="text-sm font-bold text-purple-700 dark:text-purple-400 line-clamp-1">{stats.specialty||"—"}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Chuyên môn" : "Specialty"}</p></div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 text-center border border-emerald-200 dark:border-emerald-800"><Shield size={20} className="text-emerald-500 mx-auto mb-2" /><p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{stats.isVerified?"✓":"—"}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{language === "vi" ? "Xác minh" : "Verified"}</p></div>
              </div>)}
            </div>)}

            {/* Activity Feed */}
            {activities.length > 0 && (
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white"><Clock size={20} className="text-green-500" />{language === "vi" ? "Hoạt động gần đây" : "Recent Activity"}</h2>
              <div className="space-y-3">{activities.map((a:any,i:number)=>{const days=Math.floor((now-new Date(a.date).getTime())/86400000);const ds=days===0?(language==="vi"?"Hôm nay":"Today"):days===1?(language==="vi"?"Hôm qua":"Yesterday"):`${days}d ${language==="vi"?"trước":"ago"}`;const icon=a.type==="course_completed"?"📚":a.type==="commission"?"💰":a.type==="link_created"?"🔗":"✏️";return(<div key={i} className="flex items-start gap-3 text-sm"><span className="text-base shrink-0 mt-0.5">{icon}</span><span className="flex-1 text-slate-700 dark:text-slate-300">{language==="vi"?a.textVi:a.textEn}</span><span className="text-xs text-slate-400 shrink-0">{ds}</span></div>)})}</div>
            </div>)}

            {/* Quick overview of course progress */}
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
                <BookOpen size={20} className="text-indigo-500" /> {tStr.trainingOverview}
              </h2>
              {coursesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.slice(0, 2).map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900/60 border dark:border-slate-800 rounded-2xl">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-202 line-clamp-1 mb-2">{item.course.title}</h3>
                      <div className="w-full bg-slate-202 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.progressPct}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                        <span>{language === "vi" ? "Đã hoàn thành" : "Completed"}</span>
                        <span>{item.progressPct.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                  {courses.length > 2 && (
                    <div className="md:col-span-2 text-center pt-2">
                      <button onClick={() => changeTab("courses")} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        {language === "vi" ? `Xem tất cả ${courses.length} khóa học` : `View all ${courses.length} courses`} &rarr;
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <p>{tStr.noCoursesOverview}</p>
                  <Link href="/courses" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                    {language === "vi" ? "Khám phá khóa học" : "Browse Courses"} &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "athlete" && profile && (
          <AthleteTab userProfile={profile} />
        )}

        {activeTab === "coach" && profile && (
          <CoachTab userProfile={profile} onRefresh={fetchProfileData} />
        )}

        {activeTab === "assistant" && profile && (
          <AssistantTab userProfile={profile} onRefresh={fetchProfileData} />
        )}

        {activeTab === "affiliate" && profile && (
          <AffiliateTab />
        )}

        {/* Tab 2: Enrolled Courses */}
        {activeTab === "courses" && (
          <CoursesTab courses={courses} loading={coursesLoading} language={language} trainingOverview={tStr.exploreCourses} noCoursesOverview={tStr.noCoursesTitle} browseCourses={tStr.browseCoursesBtn} completed={language==="vi"?"Đã hoàn thành":"Completed"} viewAll={(n:number)=>language==="vi"?`Xem tất cả ${n} khóa học`:`View all ${n} courses`} onChangeTab={changeTab} exploreLink="/courses" exploreLabel={tStr.browseCoursesBtn} />
        )}
        {/* Tab 3: Bookmarks */}
        {activeTab === "bookmarks" && (
          <BookmarksTab bookmarks={bookmarks} loading={bookmarksLoading} language={language} title={tStr.savedArticlesTitle} noTitle={tStr.noSavedArticlesTitle} noDesc={tStr.noSavedArticlesDesc} readNewsBtn={tStr.readNewsBtn} removeBtn={tStr.removeBtn} savedOn={tStr.savedOn} onRemove={handleRemoveBookmark} />
        )}

        {/* Tab 4: General Settings */}
        {activeTab === "settings" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Change Password */}
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
                <Lock size={20} className="text-indigo-500" /> {tStr.changePasswordTitle}
              </h2>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="curPwd" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.currentPassword}</label>
                    <div className="premium-input-wrapper">
                      <KeyRound className="premium-input-icon text-slate-400" size={18} />
                      <input
                        type={showCurPwd ? "text" : "password"}
                        id="curPwd"
                        value={pwdForm.currentPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                        className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurPwd(!showCurPwd)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer p-1"
                      >
                        {showCurPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="newPwd" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.newPassword}</label>
                    <div className="premium-input-wrapper">
                      <Lock className="premium-input-icon text-slate-400" size={18} />
                      <input
                        type={showNewPwd ? "text" : "password"}
                        id="newPwd"
                        value={pwdForm.newPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                        className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer p-1"
                      >
                        {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confPwd" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{tStr.confirmNewPassword}</label>
                    <div className="premium-input-wrapper">
                      <Lock className="premium-input-icon text-slate-400" size={18} />
                      <input
                        type={showConfPwd ? "text" : "password"}
                        id="confPwd"
                        value={pwdForm.confirmPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                        className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfPwd(!showConfPwd)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer p-1"
                      >
                        {showConfPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingPwd}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-75 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 border-none"
                  >
                    {savingPwd ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {tStr.updatePasswordBtn}
                  </button>
                </div>
              </form>
            </div>

            {/* Upgrade & Register Roles Card */}
            {(!profile?.coachProfile) && (
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
                  <User size={20} className="text-indigo-500" /> {language === "vi" ? "Đăng ký Vai trò" : "Register Role"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {language === "vi" 
                    ? "Nếu bạn muốn đăng ký thêm vai trò để tham gia thi đấu (Vận động viên) hoặc giảng dạy (Huấn luyện viên), hãy chọn nâng cấp bên dưới."
                    : "If you want to register additional roles to participate in tournaments (Athlete) or teach courses (Coach), select upgrade options below."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upgrade Athlete */}
                  <div className="flex flex-col justify-between p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {language === "vi" ? "Vận động viên (Athlete)" : "Athlete"}
                      </h3>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
                        {language === "vi"
                          ? "Tham gia giải đấu, quản lý hồ sơ bệnh án, thông số khuyết tật và tiến trình thi đấu."
                          : "Participate in tournaments, manage medical details, disability classifications, and progress."}
                      </p>
                    </div>
                    <button
                      onClick={handleUpgradeToAthlete}
                      disabled={upgradingAthlete}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-75 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 border-none mt-2"
                    >
                      {upgradingAthlete ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                      {profile?.athleteProfile
                        ? (language === "vi" ? "Thêm môn mới" : "Add New Sport")
                        : (language === "vi" ? "Đăng ký VĐV" : "Register as Athlete")}
                    </button>
                  </div>

                  {/* Upgrade Coach */}
                  {!profile?.coachProfile && (
                    <div className="flex flex-col justify-between p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {language === "vi" ? "Huấn luyện viên (Coach)" : "Coach / Instructor"}
                        </h3>
                        <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
                          {language === "vi" 
                            ? "Tạo khóa học, bài học, tải lên tài liệu học tập và quản lý học viên."
                            : "Create courses, lessons, upload study materials, and manage students."}
                        </p>
                      </div>
                      <button
                        onClick={handleUpgradeToCoach}
                        disabled={upgradingCoach}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-75 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 border-none mt-2"
                      >
                        {upgradingCoach ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                        {language === "vi" ? "Đăng ký HLV" : "Register as Coach"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Two-Factor Authentication Card */}
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
                <Shield size={20} className="text-indigo-500" /> {tStr.twoFactorTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                {tStr.twoFactorDesc}
              </p>

              {profile.isTwoFactorEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 border border-emerald-150 dark:border-emerald-900/40 rounded-xl text-sm font-bold w-fit">
                    <Shield size={18} /> {tStr.twoFactorEnabled}
                  </div>
                  <button
                    onClick={handleDisable2FA}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-655 dark:text-red-400 rounded-xl text-xs font-bold transition cursor-pointer border-none"
                  >
                    {tStr.btnDisable2FA}
                  </button>
                </div>
              ) : show2FASetup ? (
                <div className="space-y-6 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border dark:border-slate-800">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tStr.setup2FAStep1}</p>
                    {twoFactorQrCode && (
                      <div className="bg-white p-3 rounded-2xl w-fit shadow-md border mx-auto sm:mx-0">
                        <img src={twoFactorQrCode} alt="2FA QR Code" className="w-40 h-40" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tStr.setup2FAStep2}</p>
                      <code className="block bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs font-mono select-all w-fit font-bold border dark:border-slate-700 text-blue-600 dark:text-blue-400">
                        {twoFactorSecret}
                      </code>
                    </div>
                  </div>

                  <form onSubmit={handleVerify2FA} className="space-y-4 pt-4 border-t dark:border-slate-800">
                    <label htmlFor="2fa-code" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tStr.setup2FAStep3}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
                      <div className="premium-input-wrapper flex-1">
                        <Shield className="premium-input-icon text-slate-400" size={18} />
                        <input
                          type="text"
                          id="2fa-code"
                          maxLength={6}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="000000"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                          className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500 tracking-[0.2em] font-mono text-center"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={verifying2FA}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-75 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 border-none shrink-0"
                      >
                        {verifying2FA ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {tStr.btnVerify2FA}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShow2FASetup(false);
                          setTwoFactorCode("");
                          setTwoFactorSecret("");
                          setTwoFactorQrCode("");
                        }}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer border-none shrink-0"
                      >
                        {tStr.btnCancel2FA}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900/30 px-4 py-3 border dark:border-slate-800 rounded-xl text-sm font-bold w-fit">
                    <Shield size={18} /> {tStr.twoFactorDisabled}
                  </div>
                  <button
                    onClick={handleGenerate2FA}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 border-none"
                  >
                    {tStr.btnEnable2FA}
                  </button>
                </div>
              )}
            </div>

            {/* Theme Customizer Card */}
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
                <Sun size={20} className="text-blue-500" /> {tStr.appTheme}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition duration-305 relative cursor-pointer group text-center ${
                    theme === "light"
                      ? "bg-blue-50/50 dark:bg-blue-950/10 border-blue-505 dark:border-blue-400 shadow-md shadow-blue-505/5"
                      : "bg-white/40 dark:bg-slate-900/40 border-slate-202 dark:border-slate-800 hover:border-slate-302 dark:hover:border-slate-700"
                  }`}
                >
                  {theme === "light" && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-blue-505 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </span>
                  )}
                  <div className={`p-3 rounded-full mb-3 transition-colors ${theme === "light" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-404" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    <Sun size={24} />
                  </div>
                  <span className={`text-sm font-bold block ${theme === "light" ? "text-blue-600 dark:text-blue-404" : "text-slate-700 dark:text-slate-300"}`}>
                    {tStr.themeLight}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Light Mode</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition duration-305 relative cursor-pointer group text-center ${
                    theme === "dark"
                      ? "bg-blue-50/50 dark:bg-blue-950/10 border-blue-505 dark:border-blue-400 shadow-md shadow-blue-505/5"
                      : "bg-white/40 dark:bg-slate-900/40 border-slate-202 dark:border-slate-800 hover:border-slate-302 dark:hover:border-slate-700"
                  }`}
                >
                  {theme === "dark" && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-blue-505 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </span>
                  )}
                  <div className={`p-3 rounded-full mb-3 transition-colors ${theme === "dark" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-404" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    <Moon size={24} />
                  </div>
                  <span className={`text-sm font-bold block ${theme === "dark" ? "text-blue-600 dark:text-blue-404" : "text-slate-700 dark:text-slate-300"}`}>
                    {tStr.themeDark}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dark Mode</span>
                </button>
              </div>
            </div>

            {/* Language Customizer Card */}
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
                <Globe size={20} className="text-emerald-500" /> {tStr.displayLang}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("vi")}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition duration-305 relative cursor-pointer group text-center ${
                    language === "vi"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500 dark:border-emerald-400 shadow-md shadow-emerald-500/5"
                      : "bg-white/40 dark:bg-slate-900/40 border-slate-202 dark:border-slate-800 hover:border-slate-302 dark:hover:border-slate-700"
                  }`}
                >
                  {language === "vi" && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-full mb-3 flex items-center justify-center font-bold text-sm select-none transition-all ${
                    language === "vi"
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    VN
                  </div>
                  <span className={`text-sm font-bold block ${language === "vi" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                    Tiếng Việt
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Vietnamese (VI)</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition duration-305 relative cursor-pointer group text-center ${
                    language === "en"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500 dark:border-emerald-400 shadow-md shadow-emerald-500/5"
                      : "bg-white/40 dark:bg-slate-900/40 border-slate-202 dark:border-slate-800 hover:border-slate-302 dark:hover:border-slate-700"
                  }`}
                >
                  {language === "en" && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-full mb-3 flex items-center justify-center font-bold text-sm select-none transition-all ${
                    language === "en"
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    EN
                  </div>
                  <span className={`text-sm font-bold block ${language === "en" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                    English
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">English (EN)</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 md:p-8 max-w-4xl py-12 space-y-6">
        <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-3xl h-40 w-full" />
        <div className="flex gap-2">
          <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg h-10 w-24" />
          <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg h-10 w-24" />
          <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg h-10 w-24" />
        </div>
        <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-3xl h-64 w-full" />
      </div>
    }>
      <UserDashboard />
    </Suspense>
  );
}

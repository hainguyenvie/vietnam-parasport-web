"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useLanguage, useTranslation } from '@/hooks/useTranslation';
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RolesManagement } from "./RolesManagement";
import { 
  Shield, 
  User as UserIcon, 
  Check, 
  X, 
  Loader2,
  Lock,
  Unlock,
  MoreVertical
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// next/image available for migration — add unoptimized for dynamic URLs


const translations: Record<string, Record<string, any>> = {
  vi: {
    loading: "Đang tải...",
    searchPlaceholder: "Tìm kiếm tên hoặc email...",
    roleFilter: "Tất cả vai trò",
    statusFilter: "Tất cả trạng thái",
    activeStatus: "Hoạt động",
    lockedStatus: "Bị khóa",
    thUser: "Người dùng",
    thEmail: "Email",
    thRole: "Vai trò",
    thStatus: "Trạng thái",
    thRegistered: "Ngày đăng ký",
    alertRoleError: "Có lỗi khi phân quyền. Vui lòng thử lại.",
    alertConnError: "Lỗi kết nối máy chủ.",
    colToggle: "Hiển thị cột",
    colChoose: "Chọn cột hiển thị",
    pageSizeLabel: "Hiển thị",
    pageSizeSuffix: "dòng mỗi trang",
    pageDisplay: (start: number, end: number, total: number) => `Hiển thị ${start} - ${end} trên ${total} dòng`,
    noResults: "Không tìm thấy người dùng nào phù hợp.",
    thSTT: "STT",
    thActions: "Thao tác"
  },
  en: {
    loading: "Loading...",
    searchPlaceholder: "Search by name or email...",
    roleFilter: "All Roles",
    statusFilter: "All Statuses",
    activeStatus: "Active",
    lockedStatus: "Locked",
    thUser: "User",
    thEmail: "Email",
    thRole: "Role",
    thStatus: "Status",
    thRegistered: "Registration Date",
    alertRoleError: "Failed to update role. Please try again.",
    alertConnError: "Server connection error.",
    colToggle: "Show columns",
    colChoose: "Choose columns",
    pageSizeLabel: "Show",
    pageSizeSuffix: "rows per page",
    pageDisplay: (start: number, end: number, total: number) => `Showing ${start} - ${end} of ${total} rows`,
    noResults: "No matching users found.",
    thSTT: "No.",
    thActions: "Actions"
  }
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const { t } = useTranslation("roles");
  const tStr = translations[language] || translations.vi;

  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  // Load the complete admin list once, then keep search, sort, and pagination
  // client-side so the table can show all registered users instead of only the
  // API's default first page.
  const { data: rawUsers, isLoading: loadingUsers, mutate: mutateUsers } = useApi("/users?limit=500");
  const users: any[] = Array.isArray(rawUsers) ? rawUsers : rawUsers?.data || [];
  const { data: roles = [], isLoading: loadingRoles, mutate: mutateRoles } = useApi("/roles");
  const loading = loadingUsers || loadingRoles || status === "loading";
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banUserCurrentStatus, setBanUserCurrentStatus] = useState<boolean>(true);

  const handleRowClick = (e: React.MouseEvent, user: any) => {
    const target = e.target as HTMLElement;
    if (target.closest("select") || target.closest("button") || target.closest("input") || target.closest("a")) {
      return;
    }
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [approving, setApproving] = useState(false);

  const handleApproveProfile = async (userId: string, roleName: string) => {
    setApproving(true);
    try {
      const endpoint = roleName === "COACH" || roleName === "INSTRUCTOR"
        ? `/users/${userId}/coach-profile`
        : `/users/${userId}/assistant-profile`;

      const currentProfile = roleName === "COACH" || roleName === "INSTRUCTOR"
        ? selectedUser.coachProfile
        : selectedUser.assistantProfile;

      const res = await apiClient.request(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({
          ...currentProfile,
          isVerified: true
        })
      });

      if (res.ok) {
        toast.success(language === "vi" ? "Đã phê duyệt chuyên môn thành công!" : "Profile verified successfully!");
        setIsDetailModalOpen(false);
        mutateUsers();
      } else {
        toast.error(language === "vi" ? "Phê duyệt thất bại." : "Failed to verify profile.");
      }
    } catch (e) {
      toast.error(tStr.alertConnError);
    } finally {
      setApproving(false);
    }
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(["user", "email", "role", "status", "date"]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null
  });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  
  // Click outside for column visibility dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize]);

  
  
  const handleRoleChange = async (userId: string, roleId: string) => {
    setActionLoading(userId);
    try {
      const res = await apiClient.request(`/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ roleId })
      });
      if (res.ok) {
        mutateUsers();
      } else {
        toast.error(tStr.alertRoleError);
      }
    } catch (e) {
      toast.error(tStr.alertConnError);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const confirmBan = async () => {
    if (!banUserId) return;
    setActionLoading(banUserId);
    try {
      // Mock API call to ban user
      const res = await apiClient.request(`/users/${banUserId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ isActive: !banUserCurrentStatus })
      });
      if (res.ok) {
        mutateUsers();
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Không thể cập nhật trạng thái người dùng." : "Failed to update user status.", type: "danger" });
      }
    } catch (e) {
      toast.error(tStr.alertConnError);
    } finally {
      setActionLoading(null);
      setBanUserId(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      user.fullName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);

    const matchRole = 
      roleFilter === "all" ? true :
      user.role?.id === roleFilter;

    const matchStatus = 
      statusFilter === "all" ? true :
      statusFilter === "active" ? user.isActive :
      !user.isActive;

    const matchGender = 
      genderFilter === "all" ? true :
      user.gender === genderFilter;

    const getVerificationStatus = (u: any) => {
      const rName = u.role?.name;
      if (rName === "COACH" || rName === "INSTRUCTOR") {
        return u.coachProfile?.isVerified ? "verified" : "pending";
      }
      if (rName === "ASSISTANT") {
        return u.assistantProfile?.isVerified ? "verified" : "pending";
      }
      return "none";
    };

    const matchVerification = 
      verificationFilter === "all" ? true :
      verificationFilter === "none" ? getVerificationStatus(user) === "none" :
      verificationFilter === "verified" ? getVerificationStatus(user) === "verified" :
      getVerificationStatus(user) === "pending";

    return matchSearch && matchRole && matchStatus && matchGender && matchVerification;
  });

  if (sortConfig.key) {
    filteredUsers.sort((a: any, b: any) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortConfig.key) {
        case "user":
          aVal = a.fullName || "";
          bVal = b.fullName || "";
          break;
        case "email":
          aVal = a.email || "";
          bVal = b.email || "";
          break;
        case "role":
          aVal = a.role?.name || "";
          bVal = b.role?.name || "";
          break;
        case "status":
          aVal = a.isActive ? 1 : 0;
          bVal = b.isActive ? 1 : 0;
          break;
        case "date":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = a[sortConfig.key] || "";
          bVal = b[sortConfig.key] || "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Pagination calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const COLUMN_LABELS = {
    user: tStr.thUser,
    email: tStr.thEmail,
    role: tStr.thRole,
    status: tStr.thStatus,
    date: tStr.thRegistered
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700 mb-6">
        <button 
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('users')}
        >
          {language === 'vi' ? 'Người dùng' : 'Users'}
        </button>
        <button 
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('roles')}
        >
          {language === 'vi' ? 'Vai trò & Phân quyền' : 'Roles & Permissions'}
        </button>
      </div>

      {activeTab === 'users' && (
        totalItems === 0 && users.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">{tStr.noResults}</p>
          </div>
        ) : (
          <DataTable
            data={paginatedUsers}
            columns={[
              {
                key: "user",
                title: tStr.thUser,
                sortable: true,
                render: (user) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-750 shadow-sm shrink-0">
                      {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || "Avatar"} className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-slate-400 dark:text-slate-500" />}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.fullName}</span>
                  </div>
                )
              },
              {
                key: "email",
                title: tStr.thEmail,
                sortable: true,
                render: (user) => <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
              },
              {
                key: "role",
                title: tStr.thRole,
                sortable: true,
                render: (user) => (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select 
                      className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer text-slate-700 dark:text-slate-300"
                      value={user.role?.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={(session as any)?.user?.email === user.email || actionLoading === user.id}
                    >
                      {roles.map((r: any) => (
                        <option key={r.id} value={r.id} className="dark:bg-slate-800 text-slate-900 dark:text-white">
                          {t(`roleNames.${r.name}`, { defaultValue: r.name })}
                        </option>
                      ))}
                    </select>
                    {actionLoading === user.id && <Loader2 size={12} className="animate-spin text-slate-400" />}
                  </div>
                )
              },
              {
                key: "status",
                title: tStr.thStatus,
                sortable: true,
                render: (user) => (
                  user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {tStr.activeStatus}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-455">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {tStr.lockedStatus}
                    </span>
                  )
                )
              },
              {
                key: "date",
                title: tStr.thRegistered,
                sortable: true,
                render: (user) => <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>
              },
              {
                key: "actions",
                title: tStr.thActions,
                render: (user) => (
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {user.isActive ? (
                      <button
                        onClick={() => { setBanUserId(user.id); setBanUserCurrentStatus(true); }}
                        disabled={user.role?.name === 'SUPER_ADMIN'}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition cursor-pointer border-none bg-transparent disabled:opacity-30 disabled:cursor-not-allowed"
                        title={language === "vi" ? "Khóa tài khoản" : "Ban user"}
                      >
                        <Lock size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setBanUserId(user.id); setBanUserCurrentStatus(false); }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                        title={language === "vi" ? "Mở khóa tài khoản" : "Unban user"}
                      >
                        <Unlock size={16} />
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            totalRecords={totalItems}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            searchPlaceholder={tStr.searchPlaceholder}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onRowClick={handleRowClick}
            isLoading={loading}
            filterNodes={
              <div className="flex flex-wrap gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs transition cursor-pointer text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value="all">{tStr.roleFilter}</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {t(`roleNames.${r.name}`, { defaultValue: r.name })}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs transition cursor-pointer text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value="all">{tStr.statusFilter}</option>
                  <option value="active">{tStr.activeStatus}</option>
                  <option value="locked">{tStr.lockedStatus}</option>
                </select>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs transition cursor-pointer text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value="all">{language === "vi" ? "Tất cả giới tính" : "All Genders"}</option>
                  <option value="MALE">{language === "vi" ? "Nam" : "Male"}</option>
                  <option value="FEMALE">{language === "vi" ? "Nữ" : "Female"}</option>
                  <option value="OTHER">{language === "vi" ? "Khác" : "Other"}</option>
                </select>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs transition cursor-pointer text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value="all">{language === "vi" ? "Tất cả xác minh" : "All Verification"}</option>
                  <option value="verified">{language === "vi" ? "Đã xác minh" : "Verified Only"}</option>
                  <option value="pending">{language === "vi" ? "Chờ phê duyệt" : "Pending Verification"}</option>
                  <option value="none">{language === "vi" ? "Không yêu cầu" : "No Verification Required"}</option>
                </select>
              </div>
            }
          />
        )
      )}
      
      {activeTab === 'roles' && (
        <RolesManagement roles={roles} fetchRoles={mutateRoles} language={language} />
      )}

      {/* User Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800">
            <DialogTitle>{language === "vi" ? "Thông tin chi tiết Người dùng" : "User Detailed Information"}</DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {selectedUser && (
              <div className="space-y-4 text-slate-800 dark:text-slate-200">
                {/* Header Profile Summary */}
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden border">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt={selectedUser.fullName || "Avatar"} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedUser.fullName || "Người dùng"}</h3>
                    <p className="text-xs text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Account details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Vai trò</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {t(`roleNames.${selectedUser.role?.name || "USER"}`, { defaultValue: selectedUser.role?.name || "USER" })}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Trạng thái</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedUser.isActive 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                    }`}>
                      {selectedUser.isActive ? tStr.activeStatus : tStr.lockedStatus}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Số điện thoại</span>
                    <span className="font-semibold">{selectedUser.phoneNumber || "---"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Giới tính</span>
                    <span className="font-semibold">
                      {selectedUser.gender === "MALE" ? "Nam" : selectedUser.gender === "FEMALE" ? "Nữ" : selectedUser.gender === "OTHER" ? "Khác" : "---"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Ngày sinh</span>
                    <span className="font-semibold">{selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString("vi-VN") : "---"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Địa chỉ</span>
                    <span className="font-semibold">{selectedUser.address || "---"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Tiểu sử (Bio)</span>
                    <p className="mt-1 p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl italic border dark:border-slate-800">{selectedUser.bio || "Chưa thiết lập tiểu sử."}</p>
                  </div>
                </div>

                {/* Coach Profile Details */}
                {(selectedUser.role?.name === "COACH" || selectedUser.role?.name === "INSTRUCTOR") && selectedUser.coachProfile && (
                  <div className="border-t dark:border-slate-800 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Chi tiết chuyên môn Huấn luyện viên
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-400 block">Bộ môn</span>
                        <span className="font-semibold">{selectedUser.coachProfile.sport?.name || "Chưa cấu hình"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block">Kinh nghiệm</span>
                        <span className="font-semibold">{selectedUser.coachProfile.experienceYears} năm</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold text-slate-400 block">Chuyên môn sâu</span>
                        <span className="font-semibold">{selectedUser.coachProfile.specialty || "---"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold text-slate-400 block">Bằng cấp / Chứng chỉ</span>
                        {selectedUser.coachProfile.certificateUrl ? (
                          <a 
                            href={selectedUser.coachProfile.certificateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold break-all block mt-1"
                          >
                            Xem chứng chỉ (Link ngoài) &rarr;
                          </a>
                        ) : (
                          <span className="italic text-slate-400">Chưa cung cấp liên kết chứng chỉ</span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border dark:border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Trạng thái xác minh</span>
                          {selectedUser.coachProfile.isVerified ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Đã phê duyệt và xác minh</span>
                          ) : (
                            <span className="text-xs font-bold text-amber-500">Đang chờ phê duyệt hồ sơ</span>
                          )}
                        </div>
                        {!selectedUser.coachProfile.isVerified && (
                          <Button 
                            size="sm" 
                            isLoading={approving}
                            onClick={() => handleApproveProfile(selectedUser.id, selectedUser.role?.name)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Phê duyệt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assistant Profile Details */}
                {selectedUser.role?.name === "ASSISTANT" && selectedUser.assistantProfile && (
                  <div className="border-t dark:border-slate-800 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Chi tiết chuyên môn Người Hỗ Trợ
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-400 block">Mảng hỗ trợ chính</span>
                        <span className="font-semibold">
                          {selectedUser.assistantProfile.supportArea === "MEDICAL" ? "Y tế / Chăm sóc sức khỏe" :
                           selectedUser.assistantProfile.supportArea === "MOBILITY" ? "Hỗ trợ di chuyển" :
                           selectedUser.assistantProfile.supportArea === "LOGISTICS" ? "Hậu cần / Hỗ trợ chung" : "Hỗ trợ khác"}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block">VĐV hỗ trợ kết nối</span>
                        <span className="font-semibold">
                          {selectedUser.assistantProfile.athlete?.user?.fullName || "Hỗ trợ tự do / Chưa kết nối"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold text-slate-400 block">Mô tả năng lực y tế/hỗ trợ</span>
                        <p className="mt-1 p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl italic border dark:border-slate-800">{selectedUser.assistantProfile.medicalDesc || "---"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold text-slate-400 block">Chứng chỉ năng lực y tế</span>
                        {selectedUser.assistantProfile.medicalCertUrl ? (
                          <a 
                            href={selectedUser.assistantProfile.medicalCertUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold break-all block mt-1"
                          >
                            Xem chứng nhận (Link ngoài) &rarr;
                          </a>
                        ) : (
                          <span className="italic text-slate-400">Chưa cung cấp chứng nhận y tế</span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border dark:border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Trạng thái xác minh</span>
                          {selectedUser.assistantProfile.isVerified ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Đã phê duyệt và xác minh</span>
                          ) : (
                            <span className="text-xs font-bold text-amber-500">Đang chờ phê duyệt hồ sơ</span>
                          )}
                        </div>
                        {!selectedUser.assistantProfile.isVerified && (
                          <Button 
                            size="sm" 
                            isLoading={approving}
                            onClick={() => handleApproveProfile(selectedUser.id, selectedUser.role?.name)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Phê duyệt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="px-5 py-4 border-t border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              {language === "vi" ? "Đóng" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <ConfirmModal
        isOpen={banUserId !== null}
        title={language === "vi" ? (banUserCurrentStatus ? "Khóa tài khoản" : "Mở khóa tài khoản") : (banUserCurrentStatus ? "Ban User" : "Unban User")}
        message={
          language === "vi" 
            ? (banUserCurrentStatus ? "Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập được nữa." : "Bạn có chắc chắn muốn mở khóa cho tài khoản này?")
            : (banUserCurrentStatus ? "Are you sure you want to ban this user? They will not be able to log in." : "Are you sure you want to unban this user?")
        }
        confirmText={language === "vi" ? "Xác nhận" : "Confirm"}
        onConfirm={confirmBan}
        onCancel={() => setBanUserId(null)}
        type={banUserCurrentStatus ? "danger" : "info"}
      />

      <ConfirmModal
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={() => setAlertInfo({ ...alertInfo, isOpen: false })}
        type={alertInfo.type}
        isAlert={true}
      />
    </div>
  );
}

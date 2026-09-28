import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Shield, Loader2, BookOpen, FileText, Settings, Trophy, Users, Check, X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

const resourceIcons: Record<string, any> = {
  COURSE: BookOpen,
  POST: FileText,
  ROLE: Shield,
  SYSTEM: Settings,
  TOURNAMENT: Trophy,
  USER: Users
};

export function RolesManagement({ roles, fetchRoles, language }: { roles: any[], fetchRoles: () => void, language: string }) {
  const { data: session } = useSession();
  const { data: permissions = [] } = useApi("/roles/permissions");
  const { t } = useTranslation("roles");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[]
  });

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case "SUPER_ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50";
      case "ADMIN":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
      case "TOURNAMENT_MANAGER":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/50";
      case "EDITOR":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
      case "INSTRUCTOR":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800";
    }
  };

  const permissionsByResource = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    permissions.forEach((p: any) => {
      if (!grouped[p.resource]) grouped[p.resource] = [];
      grouped[p.resource].push(p);
    });
    return grouped;
  }, [permissions]);

  const openModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || "",
        permissionIds: role.permissions?.map((p: any) => p.id) || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        description: "",
        permissionIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId]
    }));
  };

  const handleToggleAllForResource = (resource: string, checked: boolean) => {
    const resourcePerms = permissionsByResource[resource] || [];
    const resourcePermIds = resourcePerms.map((p: any) => p.id);
    
    setFormData(prev => {
      let nextIds = [...prev.permissionIds];
      if (checked) {
        resourcePermIds.forEach(id => {
          if (!nextIds.includes(id)) nextIds.push(id);
        });
      } else {
        nextIds = nextIds.filter(id => !resourcePermIds.includes(id));
      }
      return { ...prev, permissionIds: nextIds };
    });
  };

  const isAllSelectedForResource = (resource: string) => {
    const resourcePerms = permissionsByResource[resource] || [];
    if (resourcePerms.length === 0) return false;
    return resourcePerms.every((p: any) => formData.permissionIds.includes(p.id));
  };

  const handleToggleAllPermissions = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: checked ? permissions.map((p: any) => p.id) : []
    }));
  };

  const isAllPermissionsSelected = useMemo(() => {
    if (permissions.length === 0) return false;
    return permissions.every((p: any) => formData.permissionIds.includes(p.id));
  }, [permissions, formData.permissionIds]);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error(t("toastNameRequired"));
      return;
    }
    
    setLoadingSubmit(true);
    try {
      const url = editingRole 
        ? getApiUrl(`/roles/${editingRole.id}`)
        : getApiUrl(`/roles`);
        
      const res = await fetch(url, {
        method: editingRole ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(t("toastSaveSuccess"));
        setIsModalOpen(false);
        fetchRoles();
      } else {
        toast.error(t("toastSaveError"));
      }
    } catch (e) {
      toast.error(t("toastConnectionError"));
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await apiClient.request(`/roles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        }
      });
      if (res.ok) {
        toast.success(t("toastDeleteSuccess"));
        fetchRoles();
      } else {
        toast.error(t("toastDeleteError"));
      }
    } catch (e) {
      toast.error(t("toastConnectionError"));
    }
  };

  const roleColumns: ColumnDef<any>[] = [
    {
      key: "name",
      title: t("thName") || "Tên vai trò",
      sortable: true,
      render: (role) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-white">
            {t(`roleNames.${role.name}`, { defaultValue: role.name })}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getRoleBadgeStyle(role.name)}`}>
            {role.name}
          </span>
        </div>
      )
    },
    {
      key: "description",
      title: t("thDesc") || "Mô tả",
      render: (role) => (
        <span className="text-sm text-slate-500 dark:text-slate-400">{role.description || t("cardDescEmpty")}</span>
      )
    },
    {
      key: "permissions",
      title: t("thPerms") || "Số quyền",
      render: (role) => (
        role.name === 'SUPER_ADMIN' ? (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 text-xs font-bold rounded-lg inline-flex items-center gap-1">
            <Check size={12} className="stroke-[3]" />
            {t("badgeAllAccess")}
          </span>
        ) : role.permissions?.length > 0 ? (
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
            {t("assignedPermissions", { count: role.permissions.length })}
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1">
            <X size={12} className="stroke-[2.5]" />
            {t("badgeReadOnly")}
          </span>
        )
      )
    },
    {
      key: "actions",
      title: t("thActions") || "Thao tác",
      render: (role) => (
        role.name !== 'SUPER_ADMIN' && role.name !== 'USER' ? (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => openModal(role)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-blue-600 rounded-lg transition border-none bg-transparent cursor-pointer"
              title={t("editRole")}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(role.id)}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 rounded-lg transition border-none bg-transparent cursor-pointer"
              title={t("deleteRole")}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : null
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DataTable
        data={roles}
        columns={roleColumns}
        totalRecords={roles.length}
        page={1}
        pageSize={roles.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onCreate={() => openModal()}
        createLabel={t("addRole")}
      />


      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogTitle className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Shield size={20} />
              </div>
              {editingRole ? t("modalTitleUpdate") : t("modalTitleCreate")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("labelCode")}
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase().replace(/\s+/g, '_')})}
                  placeholder={t("placeholderCode")}
                  disabled={editingRole !== null}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed font-mono text-sm font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("labelDesc")}
                </label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={t("placeholderDesc")}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3 gap-3">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("matrixTitle")}
                </h4>
                
                {permissions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleToggleAllPermissions(!isAllPermissionsSelected)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition self-start sm:self-auto bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/80 active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {isAllPermissionsSelected ? t("deselectAllPerms") : t("selectAllPerms")}
                  </button>
                )}
              </div>
              
              <div className="space-y-4.5">
                {Object.entries(permissionsByResource).map(([resource, perms]) => {
                  const IconComponent = resourceIcons[resource] || Shield;
                  const isAllRowSelected = isAllSelectedForResource(resource);

                  return (
                    <div key={resource} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                      {/* Row Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-955 text-blue-600 dark:text-blue-400">
                            <IconComponent size={18} />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wide">
                              {t(`resources.${resource}.name`, { defaultValue: resource })}
                            </h5>
                            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                              {t(`resources.${resource}.desc`, { defaultValue: "" })}
                            </p>
                          </div>
                        </div>
                        
                        {/* Row Select All Switch */}
                        <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto group select-none">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            {t("selectAll")}
                          </span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isAllRowSelected}
                              onChange={(e) => handleToggleAllForResource(resource, e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-650"></div>
                          </div>
                        </label>
                      </div>

                      {/* Row Actions Grid */}
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-slate-800">
                        {perms.map((p: any) => {
                          const isChecked = formData.permissionIds.includes(p.id);
                          const displayLabel = t(`actions.${p.action}`, { defaultValue: p.action });

                          return (
                            <label key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 cursor-pointer transition bg-slate-50/20 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/30 group select-none">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                                {displayLabel}
                              </span>
                              
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.id)}
                                />
                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-755 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-650"></div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              disabled={loadingSubmit}
              className="rounded-xl px-5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm"
            >
              {t("btnCancel")}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loadingSubmit || !formData.name} 
              className="min-w-[120px] rounded-xl px-5 py-2 font-bold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
            >
              {loadingSubmit ? <Loader2 size={16} className="animate-spin" /> : t("btnSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

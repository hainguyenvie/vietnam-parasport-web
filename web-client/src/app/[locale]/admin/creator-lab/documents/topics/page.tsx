"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useApi } from "@/hooks/useApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Loader2, Plus, Edit2, Trash2, AlertCircle
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DocumentTopic } from "@/types";
import { generateSlug } from "@/lib/utils";

const topicSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

type TopicFormValues = z.infer<typeof topicSchema>;

export default function AdminDocumentTopicsPage() {
  const { t } = useTranslation('adminTopics');
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: topics = [], isLoading: loading, error: fetchError, mutate } = useApi<DocumentTopic[]>(getApiUrl('/document-topics'));

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<DocumentTopic | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { name: '', slug: '', description: '' }
  });

  const nameValue = watch("name");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (!['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes((session?.user as any)?.role as string)) {
        router.push("/");
      }
    }
  }, [status, router, session]);

  useEffect(() => {
    if (!isEditMode && nameValue) {
      setValue('slug', generateSlug(nameValue));
    }
  }, [nameValue, isEditMode, setValue]);

  const handleOpenModal = (topic?: DocumentTopic) => {
    if (topic) {
      setIsEditMode(true);
      setCurrentTopicId(topic.id);
      reset({ name: topic.name, slug: topic.slug, description: topic.description || '' });
    } else {
      setIsEditMode(false);
      setCurrentTopicId(null);
      reset({ name: '', slug: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (data: TopicFormValues) => {
    setIsSubmitting(true);
    try {
      const url = isEditMode && currentTopicId ? getApiUrl(`/document-topics/${currentTopicId}`) : getApiUrl('/document-topics');
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(t('errorGen'));
      }

      setIsModalOpen(false);
      mutate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (topic: DocumentTopic) => {
    setTopicToDelete(topic);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!topicToDelete) return;
    try {
      const res = await apiClient.request(`/document-topics/${topicToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        }
      });
      if (!res.ok) throw new Error(t('errorGen'));
      mutate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsConfirmOpen(false);
      setTopicToDelete(null);
    }
  };

  const filteredTopics = topics.filter((t: DocumentTopic) => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<DocumentTopic>[] = [
    {
      key: "stt",
      title: "STT",
      render: (_, index) => index + 1,
    },
    {
      key: "name",
      title: t('thName'),
      render: (row) => <div className="font-medium text-slate-800 dark:text-slate-200">{row.name}</div>,
    },
    {
      key: "slug",
      title: t('thSlug'),
      render: (row) => <div className="text-slate-500">{row.slug}</div>,
    },
    {
      key: "description",
      title: t('thDesc'),
      render: (row) => <div className="text-sm truncate max-w-xs">{row.description}</div>,
    },
    {
      key: "actions",
      title: t('thActions'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenModal(row)}
            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
            title={t('btnEdit')}
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
            title={t('btnDelete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {fetchError && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <p>{fetchError?.info?.message || t('errorGen')}</p>
        </div>
      )}

      <DataTable 
        data={filteredTopics}
        columns={columns}
        totalRecords={filteredTopics.length}
        page={1}
        pageSize={filteredTopics.length || 10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        searchPlaceholder={t('searchPlaceholder')}
        searchValue={search}
        onSearchChange={setSearch}
        onCreate={() => handleOpenModal()}
        createLabel={t('btnAddNew')}
      />

      <Dialog open={isModalOpen} onOpenChange={(open: boolean) => !isSubmitting && setIsModalOpen(open)}>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? t('editTitle') : t('addTitle')}</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('labelName')}</label>
                <Input 
                  {...register("name")}
                  placeholder="Ví dụ: Kỹ năng quay phim"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('labelSlug')}</label>
                <Input 
                  {...register("slug")}
                  placeholder="ky-nang-quay-phim"
                />
                {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('labelDesc')}</label>
                <Input 
                  {...register("description")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                {t('btnCancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {t('btnSave')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('confirmDeleteTitle')}
        message={t('confirmDeleteDesc')}
        confirmText={t('btnConfirm')}
        cancelText={t('btnCancel')}
        type="danger"
      />
    </div>
  );
}

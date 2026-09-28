"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Info, Eye, Code } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  content: string;
  variables: string;
  updatedAt: string;
}

export default function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const templateId = resolvedParams.id;
  const router = useRouter();

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [supportedVars, setSupportedVars] = useState<string[]>([]);
  
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch template on load
  useEffect(() => {
    async function fetchTemplate() {
      try {
        const response = await apiClient.get<EmailTemplate>(`/email-templates/${templateId}`);
        if (response.ok) {
          const data = await response.json();
          setTemplate(data);
          setSubject(data.subject);
          setContent(data.content);
          setSupportedVars(JSON.parse(data.variables || "[]"));
        } else {
          setError("Không thể tải thông tin email template.");
        }
      } catch (err) {
        setError("Lỗi kết nối khi tải template.");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [templateId]);

  // Generate live preview when content or subject changes (debounced)
  useEffect(() => {
    if (!content) return;

    const timer = setTimeout(async () => {
      try {
        setPreviewError(false);
        const mockVars: any = {};
        if (supportedVars.includes("fullName")) mockVars.fullName = "Nguyễn Văn Trỗi (VĐV)";
        if (supportedVars.includes("resetLink")) mockVars.resetLink = "http://localhost:3000/reset-password?token=mock_secure_token_123&email=vdv@example.com";

        const response = await apiClient.post("/email-templates/preview", {
          content,
          variables: mockVars,
        });

        if (response.ok) {
          const previewData = await response.json();
          setPreviewHtml(previewData.html);
        } else {
          setPreviewError(true);
        }
      } catch (err) {
        console.error("Preview failed:", err);
        setPreviewError(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, supportedVars]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSaving(true);

    try {
      const response = await apiClient.put(`/email-templates/${templateId}`, {
        subject,
        content,
      });

      if (response.ok) {
        setSuccessMsg("Lưu thay đổi thành công!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError("Không thể cập nhật template. Vui lòng kiểm tra quyền hạn.");
      }
    } catch (err) {
      setError("Lỗi kết nối khi cập nhật.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 p-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/40 p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600 dark:text-red-400 font-bold">Template không tồn tại hoặc bạn không có quyền xem.</p>
          <Link href="/admin/email-templates" className="text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/admin/email-templates"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeft size={14} /> Quay lại danh sách
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {successMsg && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-3 py-1.5 rounded-xl animate-fade-in">
                {successMsg}
              </span>
            )}
            {error && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 px-3 py-1.5 rounded-xl">
                {error}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* 2-Column Editing Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Editor Form (Left Column) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-950/90 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
              <Code size={18} className="text-blue-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">Cấu hình chi tiết</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="subject">
                  Tiêu đề Email (Subject)
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="content">
                    Nội dung HTML (Handlebars)
                  </label>
                </div>
                <textarea
                  id="content"
                  required
                  rows={15}
                  className="w-full flex-1 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/20 font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white resize-y"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Supported Variables Guide */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <Info size={14} className="text-blue-500" />
                  <span>Hướng dẫn chèn biến tự động</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bạn có thể chèn các biến sau vào nội dung hoặc tiêu đề email. Hệ thống sẽ tự động thay thế khi gửi:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {supportedVars.map((v) => (
                    <span
                      key={v}
                      className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs font-mono text-blue-600 dark:text-blue-400"
                    >
                      {"{{"}
                      {v}
                      {"}}"}
                    </span>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Preview Container (Right Column) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-950/90 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col items-stretch">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3 mb-4">
              <Eye size={18} className="text-indigo-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">Xem trước trực quan (Live Preview)</h2>
            </div>

            {/* Simulated Email Client Container */}
            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/10 flex flex-col min-h-[400px]">
              {/* Header of Simulated Client */}
              <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                <div>
                  <strong>Tiêu đề:</strong> <span className="text-slate-800 dark:text-white">{subject}</span>
                </div>
                <div>
                  <strong>Người gửi:</strong> <span className="text-slate-800 dark:text-white">Vietnam ParaSports &lt;noreply@vietnam-parasports.org&gt;</span>
                </div>
                <div>
                  <strong>Người nhận:</strong> <span className="text-slate-800 dark:text-white">Nguyễn Văn Trỗi &lt;vdv@example.com&gt;</span>
                </div>
              </div>

              {/* Iframe Viewport for compiled HTML */}
              <div className="flex-1 bg-white relative">
                {previewHtml ? (
                  <iframe
                    title="Email Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full border-none absolute inset-0 bg-white"
                    sandbox="allow-same-origin allow-scripts"
                  />
                ) : previewError ? (
                  <div className="w-full h-full flex items-center justify-center text-red-500 text-xs absolute inset-0">
                    Không thể tải bản xem trước. Vui lòng thử lại.
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs absolute inset-0">
                    Đang kết xuất bản xem trước...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

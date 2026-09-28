"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Download, FileText, X, BookOpen } from "lucide-react";
import dynamic from 'next/dynamic';
import DOMPurify from 'isomorphic-dompurify';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 dark:bg-slate-900 rounded-[1.8rem]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">Đang nạp trình đọc PDF...</p>
    </div>
  )
});

interface DocumentAttachment {
  id: string;
  fileUrl: string;
  fileName?: string;
  fileType?: string;
}

interface DocumentTopic {
  id: string;
  name: string;
}

interface DocumentArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumbnailUrl: string;
  createdAt: string;
  topic?: DocumentTopic;
  attachments: DocumentAttachment[];
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [doc, setDoc] = useState<DocumentArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentAttachment | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    apiClient.request(`/documents/slug/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error("Document not found");
        return res.json();
      })
      .then(data => {
        setDoc(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Lỗi: {error || "Không tìm thấy bài viết"}</h2>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg">Quay lại</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white pt-20 pb-12 px-4 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => router.push('/creator-lab')} 
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            <span>Quay lại Creator Lab</span>
          </button>
          
          <div className="flex gap-3 items-center mb-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              {doc.topic?.name || "Chung"}
            </span>
            <span className="text-slate-400 text-sm">
              Cập nhật: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-2 flex items-start gap-4">
            <BookOpen className="shrink-0 mt-1.5 text-blue-400" size={36} />
            <span>{doc.title}</span>
          </h1>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-10">
        
        {/* Main Content */}
        <div className="lg:w-2/3">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/60 dark:border-slate-800/80">
             <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-2xl prose-a:text-blue-600 prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.content || "Chưa có nội dung") }}
             />
          </div>
        </div>

        {/* Sidebar for Resources */}
        <div className="lg:w-1/3 space-y-6">
          {doc.attachments && doc.attachments.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/60 dark:border-slate-800/80 sticky top-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <FileText className="text-blue-500" />
                Tài liệu đính kèm
              </h3>
              <div className="space-y-3">
                {doc.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 group hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                        <FileText size={20} />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate" title={att.fileName || "Tài liệu"}>
                          {att.fileName || "Tài liệu"}
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">Tài liệu PDF</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setSelectedAttachment(att)}
                        className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition cursor-pointer border-none"
                        title="Đọc ngay"
                      >
                        <BookOpen size={18} />
                      </button>
                      <a 
                        href={att.fileUrl} 
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                        title="Tải xuống"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-slate-500 text-sm">Không có tài liệu đính kèm nào.</p>
            </div>
          )}
        </div>

      </div> 


      {/* PDF VIEWER MODAL */}
      {selectedAttachment && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 pt-20 md:p-12 md:pt-24 backdrop-blur-md animate-in zoom-in-95 fade-in duration-200">
          <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh] h-full">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <h3 className="text-xl font-bold">
                {selectedAttachment.fileName || "Đang xem tài liệu"}
              </h3>
              <button 
                onClick={() => setSelectedAttachment(null)}
                className="p-2 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-200/50 dark:bg-slate-950/50 relative">
              {(() => {
                const url = selectedAttachment.fileUrl;
                const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
                const isPdf = !cleanUrl.includes('heyzine.com') 
                  && !cleanUrl.includes('flipbook')
                  && !cleanUrl.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|html|htm)$/);

                if (isPdf) {
                  return <PdfViewer file={url.includes('w3.org') ? '/dummy.pdf' : url} />;
                }
                return (
                  <iframe 
                    src={url} 
                    className="w-full h-full border-none"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

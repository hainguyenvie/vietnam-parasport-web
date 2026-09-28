"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Video, Link as LinkIcon } from "lucide-react";

import Image from 'next/image';

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  type?: "image" | "video" | "both";
  placeholder?: string;
  className?: string;
}

export function MediaUpload({ value, onChange, type = "both", placeholder = "Tải file lên hoặc dán link", className = "" }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    
    // Validate size
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (type === "image" && !isImage) {
      setErrorMsg("Vui lòng chọn file ảnh.");
      return;
    }
    if (type === "video" && !isVideo) {
      setErrorMsg("Vui lòng chọn file video.");
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      setErrorMsg("Kích thước ảnh không được vượt quá 10MB");
      return;
    }
    if (isVideo && file.size > 50 * 1024 * 1024) {
      setErrorMsg("Kích thước video không được vượt quá 50MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient.request("/media/upload?isPublic=true", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Tải lên thất bại");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Lỗi kết nối khi tải lên");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isValueVideo = value?.match(/\.(mp4|webm|ogg)$/i) || value?.includes("youtube.com") || value?.includes("vimeo.com");

  return (
    <div className={`space-y-2 ${className}`}>
      {value ? (
        <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col group min-h-[150px] items-center justify-center">
          {isValueVideo ? (
            <video src={value} controls className="w-full max-h-64 object-contain bg-black" />
          ) : (
            <img loading="lazy" src={value} alt="Media" className="w-full max-h-64 object-contain" />
          )}
          
          {/* Overlay to remove or change */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition"
            >
              Thay đổi
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 bg-rose-600 text-white rounded-lg shadow-sm hover:bg-rose-700 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group min-h-[150px]"
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm font-medium">Đang tải lên...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-500 transition mb-3">
                {type === "both" && <Upload size={32} />}
                {type === "image" && <ImageIcon size={32} />}
                {type === "video" && <Video size={32} />}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center font-medium">
                Kéo thả hoặc nhấp để tải {type === "image" ? "ảnh" : type === "video" ? "video" : "file"} lên
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                {type === "image" ? "Hỗ trợ PNG, JPG, SVG (Tối đa 10MB)" : 
                 type === "video" ? "Hỗ trợ MP4, WEBM (Tối đa 50MB)" : 
                 "Ảnh (Tối đa 10MB) - Video (Tối đa 50MB)"}
              </p>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-sm text-rose-500 font-medium mt-1 text-center">{errorMsg}</p>
      )}

      <div className="flex items-center gap-2 mt-2">
        <LinkIcon size={16} className="text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 py-1 focus:outline-none focus:border-blue-500 transition-colors text-slate-700 dark:text-slate-300"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={type === "image" ? "image/*" : type === "video" ? "video/*" : "image/*,video/*"}
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

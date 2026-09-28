"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import Image from 'next/image';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: React.ReactNode;
}

export default function SecureImage({ src, fallback, alt = "Hình ảnh", className, ...props }: SecureImageProps) {
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) return;

    // If it's already a blob or data URL, use it directly
    if (src.startsWith("blob:") || src.startsWith("data:")) {
      setBlobUrl(src);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch secure image");
        return res.blob();
      })
      .then((blob) => {
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading secure image:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      // Revoke the blob URL to prevent memory leaks when source changes or component unmounts
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Disable right click context menu (save image as)
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault(); // Disable image dragging
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-xl ${className}`} style={{ minHeight: "100px" }}>
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-400 dark:text-slate-500 rounded-xl p-4 border dark:border-slate-700 ${className}`} style={{ minHeight: "100px" }}>
        Không thể tải ảnh bảo mật
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      {...props}
    />
  );
}

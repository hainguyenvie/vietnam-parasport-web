"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link, Check, QrCode } from "lucide-react";
import { toast } from "sonner";

import Image from 'next/image';

interface ShareButtonProps {
  url: string;
  title?: string;
}

export default function ShareButton({ url, title = "Bài viết" }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowQR(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("Đã sao chép liên kết bài viết!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Copy link failed", err);
        toast.error("Không thể sao chép liên kết.");
      });
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank", "width=600,height=400");
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 flex items-center justify-center gap-2 px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full font-medium transition active:scale-95 shadow-sm text-sm"
      >
        <Share2 size={16} />
        Chia sẻ
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-12 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-4 z-50 animate-in slide-in-from-bottom-2 duration-150">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Chia sẻ liên kết</h4>
          
          {!showQR ? (
            <div className="space-y-1">
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition text-left text-sm text-slate-700 dark:text-slate-300 font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <Link size={16} className="text-slate-400" />
                  Sao chép liên kết
                </div>
                {copied ? <Check size={16} className="text-emerald-500" /> : null}
              </button>

              {/* Share FB */}
              <button
                onClick={shareFacebook}
                className="w-full flex items-center gap-2.5 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition text-left text-sm text-slate-700 dark:text-slate-300 font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                Chia sẻ lên Facebook
              </button>

              {/* Share Twitter */}
              <button
                onClick={shareTwitter}
                className="w-full flex items-center gap-2.5 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition text-left text-sm text-slate-700 dark:text-slate-300 font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500 shrink-0"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                Chia sẻ lên Twitter / X
              </button>

              {/* Show QR */}
              <button
                onClick={() => setShowQR(true)}
                className="w-full flex items-center gap-2.5 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition text-left text-sm text-slate-700 dark:text-slate-300 font-semibold"
              >
                <QrCode size={16} className="text-amber-500" />
                Tạo mã QR Code
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 animate-in fade-in duration-200">
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-inner mb-3">
                <img loading="lazy" 
                  src={qrImageUrl}
                  alt="Mã QR liên kết"
                  className="w-32 h-32 object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-3">
                Quét mã để xem bài viết này trên thiết bị di động
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Quay lại danh sách
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

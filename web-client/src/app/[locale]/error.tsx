"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center rounded-full animate-in zoom-in duration-300">
        <AlertOctagon size={40} />
      </div>
      <div className="space-y-2 max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Đã xảy ra lỗi không mong muốn</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Chúng tôi rất xin lỗi vì sự bất tiện này. Hệ thống đã ghi nhận lỗi và sẽ xử lý trong thời gian sớm nhất.
        </p>
      </div>
      <div className="flex items-center gap-4 animate-in slide-in-from-bottom-6 duration-500">
        <Button onClick={() => reset()} variant="secondary">
          <RefreshCw size={16} /> Thử lại ngay
        </Button>
        <Link href="/">
          <Button variant="default">
            <Home size={16} /> Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}

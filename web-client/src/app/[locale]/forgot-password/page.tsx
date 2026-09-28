"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, Send } from "lucide-react";
import { getApiUrl } from "@/utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(getApiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError("Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau 15 phút.");
      } else if (!res.ok) {
        setError(data.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
      } else {
        setMessage(data.message || "Yêu cầu khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
      }
    } catch (err: any) {
      setError("Đã xảy ra lỗi kết nối với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 p-4 relative overflow-hidden">
      {/* Background gradients for premium aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="glass-card p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10 border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <Send size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-center text-slate-800 dark:text-white tracking-tight">
            Quên mật khẩu?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center">
            Nhập email của bạn để nhận liên kết khôi phục mật khẩu.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold" role="alert">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="email">
              Địa chỉ Email
            </label>
            <div className="premium-input-wrapper relative flex items-center">
              <Mail className="absolute left-3 text-slate-400" size={18} />
              <input
                id="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-required="true"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98] border-none text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Gửi yêu cầu"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
            <ArrowLeft size={14} />
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}

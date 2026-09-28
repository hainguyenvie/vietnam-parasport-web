"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Loader2, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { getApiUrl } from "@/utils/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams?.get("token");
  const email = searchParams?.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token || !email) {
      setError("Thiếu thông tin xác thực. Vui lòng nhấp vào liên kết trong email của bạn.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl("/auth/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Đã xảy ra lỗi khi đặt lại mật khẩu.");
      } else {
        setMessage("Mật khẩu của bạn đã được thay đổi thành công! Đang chuyển hướng về trang đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError("Đã xảy ra lỗi kết nối với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-750 dark:text-red-400 rounded-2xl text-sm font-semibold">
          Liên kết khôi phục mật khẩu không hợp lệ hoặc thiếu thông tin cần thiết.
        </div>
        <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
          <ArrowLeft size={14} /> Gửi lại yêu cầu khôi phục
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-750 dark:text-red-400 rounded-xl text-xs font-semibold" role="alert">
          {error}
        </div>
      )}

      {message ? (
        <div className="text-center space-y-4 py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle size={28} />
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold" role="alert">
            {message}
          </div>
          <Link href="/login" className="inline-block bg-blue-600 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-blue-700 transition">
            Đăng nhập ngay
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="newPassword">
              Mật khẩu mới
            </label>
            <div className="premium-input-wrapper relative flex items-center">
              <Lock className="absolute left-3 text-slate-400" size={18} />
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="confirmPassword">
              Xác nhận mật khẩu mới
            </label>
            <div className="premium-input-wrapper relative flex items-center">
              <Lock className="absolute left-3 text-slate-400" size={18} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
              "Đặt lại mật khẩu"
            )}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 p-4 relative overflow-hidden">
      {/* Background gradients for premium aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="glass-card p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10 border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-center text-slate-800 dark:text-white tracking-tight">
            Đặt lại mật khẩu
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center">
            Vui lòng nhập mật khẩu mới của bạn bên dưới.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-6">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Shield, KeyRound, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { useLocale } from "next-intl";

const loginValidation = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export default function LoginPage() {
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const defaultDestination = `/${locale}/profile`;
  const requestedDestination = searchParams?.get("callbackUrl");
  const destination =
    requestedDestination &&
    requestedDestination.startsWith(`/${locale}/`) &&
    !requestedDestination.startsWith("//")
      ? requestedDestination
      : defaultDestination;

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(destination);
    }
  }, [destination, router, status]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/providers")
      .then((response) => response.ok ? response.json() : {})
      .then((providers: Record<string, unknown>) => {
        if (active) setGoogleEnabled(Boolean(providers?.google));
      })
      .catch(() => {
        if (active) setGoogleEnabled(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const getLoginErrorMessage = (loginError: string) => {
    const normalizedError = loginError.toLowerCase();

    if (
      normalizedError.includes("too many") ||
      normalizedError.includes("throttler") ||
      normalizedError.includes("rate limit")
    ) {
      return "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ khoảng 1 phút rồi thử lại.";
    }

    if (
      normalizedError.includes("invalid credentials") ||
      normalizedError.includes("credentialsignin") ||
      normalizedError.includes("đăng nhập thất bại")
    ) {
      return "Email hoặc mật khẩu không chính xác.";
    }

    if (normalizedError.includes("connection") || normalizedError.includes("fetch")) {
      return "Không thể kết nối máy chủ. Vui lòng thử lại sau.";
    }

    return "Đăng nhập không thành công. Vui lòng kiểm tra thông tin và thử lại.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Client-side validation
    const validation = loginValidation.safeParse({ email, password });
    if (!validation.success) {
      const errors: any = {};
      validation.error.issues.forEach((err: any) => {
        if (err.path[0]) errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const signInData: any = {
        redirect: false,
        email,
        callbackUrl: destination,
      };

      if (show2FA) {
        signInData.totpToken = totpToken;
      } else {
        signInData.password = password;
      }

      const res = await signIn("credentials", signInData);

      if (res?.error) {
        if (res.error === "2FA_REQUIRED") {
          setShow2FA(true);
        } else {
          setError(getLoginErrorMessage(res.error || ""));
        }
      } else {
        if (rememberMe && !show2FA) {
          localStorage.setItem("rememberedEmail", email);
        } else if (!rememberMe && !show2FA) {
          localStorage.removeItem("rememberedEmail");
        } else if (show2FA && rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        }
        window.location.assign(destination);
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

      <div className="glass-card p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10 border border-slate-200/60 dark:border-slate-800/80">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            {show2FA ? <Shield size={24} /> : <KeyRound size={24} />}
          </div>
          <h1 className="text-2xl font-extrabold text-center text-slate-800 dark:text-white tracking-tight" aria-label="Đăng nhập">
            {show2FA ? "Xác thực hai lớp (2FA)" : "Đăng nhập tài khoản"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center">
            {show2FA 
              ? "Vui lòng nhập mã bảo mật 6 số từ ứng dụng xác thực của bạn." 
              : "Chào mừng bạn quay trở lại với Vietnam ParaSports."}
          </p>
        </div>
        
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!show2FA ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="pl-10"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-required="true"
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="email-error" className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Mật khẩu
                  </Label>
                  <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-required="true"
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                  {fieldErrors.password && (
                    <p id="password-error" className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <Label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                  Ghi nhớ đăng nhập
                </Label>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="totpToken" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Mã xác thực 2FA
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="totpToken"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  className="pl-10 text-center tracking-[0.2em] font-mono"
                  placeholder="000000"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ""))}
                  aria-required="true"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            aria-label={show2FA ? "Xác nhận mã 2FA" : "Nút Đăng nhập"}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {show2FA ? "Xác nhận" : "Đăng nhập"}
                <ArrowRight size={14} />
              </>
            )}
          </Button>
        </form>

        {!show2FA && googleEnabled && (
          <>
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800/80"></div>
              </div>
              <span className="relative px-3 bg-white dark:bg-[#1a2333] text-xs text-slate-400 dark:text-slate-500 font-medium">Hoặc đăng nhập bằng</span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full"
              aria-label="Đăng nhập bằng Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
          </>
        )}

        <div className="mt-6 text-center">
          {show2FA ? (
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setShow2FA(false);
                setTotpToken("");
              }}
            >
              Quay lại đăng nhập thường
            </Button>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

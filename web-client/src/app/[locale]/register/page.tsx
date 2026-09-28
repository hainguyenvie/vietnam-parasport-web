"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Phone, Calendar, Users, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

const registerValidation = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("MALE");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = registerValidation.safeParse({ fullName, email, password });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err: any) => {
        if (err.path[0]) errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phoneNumber,
          dob,
          gender,
          role,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Đăng ký thất bại");
        return;
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 p-4 relative overflow-hidden">
      {/* Background gradients for premium aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl max-w-2xl w-full relative z-10 border border-slate-200/60 dark:border-slate-800/80">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <User size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-center text-slate-800 dark:text-white tracking-tight" aria-label="Đăng ký tài khoản">
            Đăng ký tài khoản mới
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center">
            Tham gia cổng thông tin thể thao người khuyết tật Việt Nam.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cột trái: Thông tin tài khoản */}
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 border-b pb-1 dark:border-slate-800">
                Thông tin cơ bản
              </h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider" htmlFor="fullName">
                  Họ và tên
                </label>
                <div className="premium-input-wrapper">
                  <User className="premium-input-icon text-slate-400" size={18} />
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-required="true"
                  />
                  {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider" htmlFor="email">
                  Email
                </label>
                <div className="premium-input-wrapper">
                  <Mail className="premium-input-icon text-slate-400" size={18} />
                  <input
                    id="email"
                    type="email"
                    required
                    className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-required="true"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="premium-input-wrapper relative">
                  <Lock className="premium-input-icon text-slate-400" size={18} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500 pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-required="true"
                    minLength={6}
                  />
                  {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
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
            </div>

            {/* Cột phải: Thông tin cá nhân & Vai trò */}
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 border-b pb-1 dark:border-slate-800">
                Hồ sơ cá nhân & Vai trò
              </h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider" htmlFor="phoneNumber">
                  Số điện thoại
                </label>
                <div className="premium-input-wrapper">
                  <Phone className="premium-input-icon text-slate-400" size={18} />
                  <input
                    id="phoneNumber"
                    type="tel"
                    required
                    className="premium-input border-slate-202 dark:border-slate-700 text-sm focus:border-blue-500"
                    placeholder="0987654321"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider" htmlFor="dob">
                    Ngày sinh
                  </label>
                  <div className="premium-input-wrapper">
                    <Calendar className="premium-input-icon text-slate-400" size={18} />
                    <input
                      id="dob"
                      type="date"
                      required
                      className="premium-input border-slate-202 dark:border-slate-700 text-xs focus:border-blue-500"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider" htmlFor="gender">
                    Giới tính
                  </label>
                  <div className="premium-input-wrapper">
                    <Users className="premium-input-icon text-slate-400" size={18} />
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger aria-label="Giới tính">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider" htmlFor="role">
                  Vai trò trên hệ thống
                </label>
                <div className="premium-input-wrapper">
                  <Users className="premium-input-icon text-slate-400" size={18} />
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger aria-label="Vai trò trên hệ thống">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Thành viên (Khán giả/Đọc giả)</SelectItem>
                      <SelectItem value="ATHLETE">Vận động viên khuyết tật</SelectItem>
                      <SelectItem value="COACH">Huấn luyện viên / Giảng viên</SelectItem>
                      <SelectItem value="ASSISTANT">Người hỗ trợ chuyên môn (Trợ lý)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              aria-label="Đăng ký tài khoản"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Đăng ký tài khoản
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

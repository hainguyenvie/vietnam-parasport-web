import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân",
  description: "Quản lý hồ sơ cá nhân, khóa học, bài viết đã lưu và cài đặt tài khoản tại Vietnam ParaSports.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

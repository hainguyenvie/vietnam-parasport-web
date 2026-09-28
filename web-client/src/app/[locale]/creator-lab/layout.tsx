import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Lab",
  description: "Học cách xây dựng kênh cá nhân, sản xuất nội dung và phát triển thương hiệu cho vận động viên Paralympic.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

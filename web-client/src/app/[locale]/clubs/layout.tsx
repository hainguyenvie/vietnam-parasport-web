import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Câu lạc bộ",
  description: "Danh sách các câu lạc bộ thể thao người khuyết tật trên toàn quốc — tìm CLB gần bạn và tham gia tập luyện.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

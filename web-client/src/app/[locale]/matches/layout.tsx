import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lịch thi đấu & Kết quả",
  description: "Lịch thi đấu và kết quả các giải thể thao người khuyết tật — cập nhật trực tiếp từ Vietnam ParaSports.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

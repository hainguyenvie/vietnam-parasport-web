import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng xếp hạng",
  description: "Bảng xếp hạng vận động viên, đội tuyển Paralympic Việt Nam theo bộ môn và giải đấu.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

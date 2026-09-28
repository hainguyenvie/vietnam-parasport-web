import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đồng hành",
  description: "Đồng hành cùng thể thao người khuyết tật Việt Nam — tài trợ, tình nguyện, hợp tác truyền thông.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

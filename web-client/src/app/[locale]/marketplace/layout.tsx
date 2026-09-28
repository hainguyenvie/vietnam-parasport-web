import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chợ thể thao",
  description: "Mua sắm dụng cụ thể thao, sản phẩm hỗ trợ từ các cửa hàng và vận động viên Paralympic Việt Nam.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Về chúng tôi | Vietnam ParaSports',
  description: 'Giới thiệu về Vietnam ParaSports - Cổng thông tin và kết nối cộng đồng thể thao người khuyết tật Việt Nam.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

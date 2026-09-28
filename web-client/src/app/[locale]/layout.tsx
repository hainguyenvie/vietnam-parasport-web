import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalModal } from "@/components/ui/GlobalModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/components/SettingsProvider";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import AiAssistant from "@/components/AiAssistant";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

async function fetchSettings() {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api/v1";
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/settings`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      return data?.data || data;
    }
  } catch (e) {
    console.error("Error fetching settings for metadata", e);
  }
  return {};
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const siteTitle = settings?.siteTitle || "Việt Nam Paralympic Sport";
  
  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: "Cộng đồng thể thao người khuyết tật Việt Nam — Kết nối vận động viên, câu lạc bộ, giải đấu và người hâm mộ Paralympic.",
    icons: {
      icon: [
        {
          url: "/assets/brand/vietnam-parasports-2026-mark.png",
          type: "image/png",
        },
      ],
      shortcut: ["/assets/brand/vietnam-parasports-2026-mark.png"],
      apple: "/assets/brand/vietnam-parasports-2026-mark.png",
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      alternateLocale: "en_US",
      siteName: siteTitle,
      title: siteTitle,
      description: "Cộng đồng thể thao người khuyết tật Việt Nam",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: "Cộng đồng thể thao người khuyết tật Việt Nam",
    },
    robots: { index: true, follow: true },
    alternates: { canonical: "/", languages: { vi: "/vi", en: "/en" } },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Vietnam ParaSports',
              url: 'https://vietnamparasports.com',
              description: 'Cộng đồng thể thao người khuyết tật Việt Nam',
              sameAs: [],
            }),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Skip to main content / Bỏ qua đến nội dung chính
        </a>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <SettingsProvider>
                <AccessibilityProvider>
                  <TooltipProvider>
                    <Header />
                    <div className="flex-1" id="main-content" tabIndex={-1}>
                      {children}
                    </div>
                    <Footer />
                    <BackToTop />
                    <AccessibilityPanel />
                    <AiAssistant />
                    <Toaster />
                    <GlobalModal />
                  </TooltipProvider>
                </AccessibilityProvider>
              </SettingsProvider>
            </ThemeProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

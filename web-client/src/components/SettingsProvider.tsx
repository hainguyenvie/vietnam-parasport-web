"use client";

import { getApiUrl } from "@/utils/api";

import React, { createContext, useContext, useEffect, useState } from "react";

interface CarouselItem {
  url: string;
  title: string;
  link: string;
}

interface Settings {
  siteTitle?: string;
  logoPath: string | null;
  faviconPath: string | null;
  heroCarousel: CarouselItem[];
  heroContent?: { titleVi?: string; titleEn?: string; descVi?: string; descEn?: string };
  footerContent?: { aboutVi?: string; aboutEn?: string; addressVi?: string; addressEn?: string; phone?: string; email?: string };
  HEADER_MENU_ORDER?: string[];
  HEADER_MENU_VISIBILITY?: Record<string, boolean>;
  ADMIN_SIDEBAR_ORDER?: string[];
  ADMIN_SIDEBAR_VISIBILITY?: Record<string, boolean>;
  HERO_BANNER_SIZE?: string | number;
  HERO_IMAGE_FIT?: string;
  HERO_SHOW_CONTENT?: boolean;
  SHOW_PARTNERS?: boolean;
  HEADER_COLOR?: string;
  FOOTER_COLOR?: string;
  HEADER_TEXT_COLOR?: string;
  FOOTER_TEXT_COLOR?: string;
}

const defaultSettings: Settings = {
  siteTitle: "Vietnam ParaSports",
  logoPath: null,
  faviconPath: null,
  heroCarousel: [
    {
      url: "/assets/homepage/creator-lab-launch.jpg",
      title: "Vietnam ParaSports Creator Lab — Lan tỏa dấu ấn cá nhân trên nền tảng số",
      link: "/creator-lab",
    },
    {
      url: "/assets/homepage/creator-lab-summit.jpg",
      title: "Vietnam ParaSports Creator Lab Summit 2026",
      link: "/creator-lab",
    },
    {
      url: "/uploads/1781644852147-pcy2n1.jpg",
      title: "Niềm vui chiến thắng của đoàn thể thao người khuyết tật Việt Nam",
      link: "/news",
    },
    {
      url: "/uploads/1781644855465-frmous.jpg",
      title: "Thể thao Việt Nam lan tỏa tinh thần đoàn kết",
      link: "/news",
    },
    {
      url: "/uploads/1781644859054-tpt9zs.jpg",
      title: "Cộng đồng ParaSports cùng vượt qua giới hạn",
      link: "/clubs",
    },
  ],
  heroContent: {
    titleVi: "Cùng thể thao, cùng tỏa sáng",
    titleEn: "Vietnam Para Sports",
    descVi: "Cập nhật thành tích, hành trình tập luyện và những câu chuyện truyền cảm hứng của cộng đồng thể thao người khuyết tật Việt Nam.",
    descEn: "Connect passion, overcome limits.",
  },
  SHOW_PARTNERS: true,
  HERO_BANNER_SIZE: "large",
  HERO_IMAGE_FIT: "cover",
  HERO_SHOW_CONTENT: true,
  HEADER_COLOR: "#bf0413",
  HEADER_TEXT_COLOR: "#ffffff",
  FOOTER_COLOR: "#8f0010",
  FOOTER_TEXT_COLOR: "#ffffff",
};

const SettingsContext = createContext<{ settings: Settings; loading: boolean; refreshSettings: () => Promise<void> }>({
  settings: defaultSettings,
  loading: false,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const apiUrl = getApiUrl("/").replace(/\/+$/, '');
      const res = await fetch(`${apiUrl}/settings`);
      if (res.ok) {
        const envelope = await res.json();
        const settingsData = envelope?.data || envelope;
        const newSettings: Settings = {
          siteTitle: settingsData.siteTitle,
          logoPath: settingsData.logoPath ? (settingsData.logoPath.startsWith("http") ? settingsData.logoPath : `/${settingsData.logoPath.replace(/^\/+/, '')}`) : null,
          faviconPath: settingsData.faviconPath ? (settingsData.faviconPath.startsWith("http") ? settingsData.faviconPath : `/${settingsData.faviconPath.replace(/^\/+/, '')}`) : null,
          heroCarousel: Array.isArray(settingsData.HERO_CAROUSEL) ? settingsData.HERO_CAROUSEL.map((item: any) => ({
            ...item,
            url: item.url?.startsWith("http") ? item.url : `/${(item.url || "").replace(/^\/+/, '')}`,
          })) : [],
          heroContent: settingsData.HERO_CONTENT,
          footerContent: settingsData.FOOTER_CONTENT,
          HEADER_MENU_ORDER: Array.isArray(settingsData.HEADER_MENU_ORDER) ? settingsData.HEADER_MENU_ORDER : undefined,
          HEADER_MENU_VISIBILITY: settingsData.HEADER_MENU_VISIBILITY,
          ADMIN_SIDEBAR_ORDER: Array.isArray(settingsData.ADMIN_SIDEBAR_ORDER) ? settingsData.ADMIN_SIDEBAR_ORDER : undefined,
          ADMIN_SIDEBAR_VISIBILITY: settingsData.ADMIN_SIDEBAR_VISIBILITY,
          SHOW_PARTNERS: settingsData.SHOW_PARTNERS !== false,
          HERO_BANNER_SIZE: settingsData.HERO_BANNER_SIZE || 60,
          HERO_IMAGE_FIT: settingsData.HERO_IMAGE_FIT || 'cover',
          HERO_SHOW_CONTENT: settingsData.HERO_SHOW_CONTENT,
          HEADER_COLOR: settingsData.HEADER_COLOR,
          FOOTER_COLOR: settingsData.FOOTER_COLOR,
          HEADER_TEXT_COLOR: settingsData.HEADER_TEXT_COLOR,
          FOOTER_TEXT_COLOR: settingsData.FOOTER_TEXT_COLOR,
        };
        setSettings(newSettings);

        // Dynamically update document title
        if (newSettings.siteTitle) {
          // preserve the suffix if it exists, or just set it
          const suffix = document.title.includes("—") ? document.title.substring(document.title.indexOf("—") - 1) : "";
          if (suffix && !document.title.includes("|")) {
             document.title = `${newSettings.siteTitle} ${suffix}`;
          } else {
             // For admin pages it's usually "Page Name | Site Title"
             const prefixMatch = document.title.match(/^(.*?) \| /);
             if (prefixMatch) {
                 document.title = `${prefixMatch[1]} | ${newSettings.siteTitle}`;
             } else {
                 document.title = newSettings.siteTitle;
             }
          }
        }

        // Dynamically update favicon
        if (newSettings.faviconPath) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.getElementsByTagName("head")[0].appendChild(link);
          }
          link.href = newSettings.faviconPath;
        }
      }
    } catch (err) {
      console.error("Failed to fetch global settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

import type { MetadataRoute } from "next";

const BASE_URL = "https://vietnamparasports.com";
const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api/v1";

async function fetchFromAPI(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (res.ok) return await res.json();
  } catch { /* skip on error */ }
  return null;
}

function safeDate(val: unknown): Date | null {
  if (!val) return null;
  try {
    const d = new Date(val as any);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["vi", "en"];
  const entries: MetadataRoute.Sitemap = [];

  const staticPages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1.0, changeFrequency: "daily" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/news", priority: 0.9, changeFrequency: "daily" },
    { path: "/sports", priority: 0.7, changeFrequency: "weekly" },
    { path: "/matches", priority: 0.8, changeFrequency: "daily" },
    { path: "/rankings", priority: 0.8, changeFrequency: "weekly" },
    { path: "/clubs", priority: 0.7, changeFrequency: "weekly" },
    { path: "/marketplace", priority: 0.7, changeFrequency: "weekly" },
    { path: "/creator-lab", priority: 0.8, changeFrequency: "weekly" },
    { path: "/companion", priority: 0.6, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.4, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/accessibility", priority: 0.3, changeFrequency: "yearly" },
  ];

  for (const { path, priority, changeFrequency } of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority: locale === "vi" ? priority : priority - 0.1,
      });
    }
  }

  // Dynamic: news articles
  const newsData = await fetchFromAPI("/posts?take=200");
  const articles = newsData?.data || newsData || [];
  for (const article of Array.isArray(articles) ? articles : []) {
    if (article.slug) {
      const articleDate = safeDate(article.updatedAt) || safeDate(article.createdAt) || new Date();
      entries.push({
        url: `${BASE_URL}/vi/news/${article.slug}`,
        lastModified: articleDate,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      entries.push({
        url: `${BASE_URL}/en/news/${article.slug}`,
        lastModified: articleDate,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  // Dynamic: sports
  const sportsData = await fetchFromAPI("/sports");
  const sports = sportsData?.data || (Array.isArray(sportsData) ? sportsData : []);
  for (const sport of sports) {
    if (sport.slug) {
      entries.push({
        url: `${BASE_URL}/vi/sports/${sport.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

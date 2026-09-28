import HomeClient from './HomeClient';

export const revalidate = 60;

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

export async function generateMetadata() {
  const settings = await fetchSettings();
  const siteTitle = settings?.siteTitle || "Việt Nam Paralympic Sport";
  
  return {
    title: `${siteTitle} — Cộng đồng thể thao người khuyết tật`,
    description: "Cập nhật tin tức, lịch thi đấu, bảng xếp hạng và kết nối vận động viên, câu lạc bộ Paralympic Việt Nam.",
    openGraph: {
      type: "website",
      title: siteTitle,
      description: "Cộng đồng thể thao người khuyết tật Việt Nam — Kết nối vận động viên, câu lạc bộ, giải đấu và người hâm mộ Paralympic.",
    },
  };
}

async function getApiBase() {
  const baseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1';
  return baseUrl.replace(/\/+$/, '');
}

export default async function HomePage() {
  const apiBase = await getApiBase();
  let initialData;

  try {
    const [postsRes, partnersRes, statsRes, sportsRes] = await Promise.all([
      fetch(`${apiBase}/posts?take=30`, { next: { revalidate: 60 } }),
      fetch(`${apiBase}/partners`, { next: { revalidate: 60 } }),
      fetch(`${apiBase}/statistics/summary`, { next: { revalidate: 60 } }),
      fetch(`${apiBase}/sports`, { next: { revalidate: 60 } }),
    ]);

    const [posts, partners, statistics, sportsShowcase] = await Promise.all([
      postsRes.ok ? postsRes.json().then(r => r.data || []) : [],
      partnersRes.ok ? partnersRes.json().then(r => r.data || []) : [],
      statsRes.ok ? statsRes.json().then(r => r.data || []) : [],
      sportsRes.ok ? sportsRes.json().then(r => r.data || []) : [],
    ]);

    initialData = {
      posts: posts.map((p: any) => ({ ...p, category: p.category || { name: 'Tin tức chung' } })),
      partners,
      statistics,
      sportsShowcase,
    };
  } catch {
    // Fall back to client-side fetching if server fetch fails
    initialData = undefined;
  }

  return <HomeClient initialData={initialData} />;
}

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostInteractions from "@/components/PostInteractions";
import TextToSpeech from "@/components/TextToSpeech";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";
import DOMPurify from 'isomorphic-dompurify';
import Image from 'next/image';

async function getPost(slug: string) {
  try {
    const res = await apiClient.request(`/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch post");
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Không tìm thấy bài viết" };

  return {
    title: `${post.title} - VNParalympic`,
    description: post.excerpt,
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // JSON-LD structured data for NewsArticle
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.thumbnail || undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    author: post.author?.fullName ? { '@type': 'Person', name: post.author.fullName } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Vietnam ParaSports',
      url: 'https://vietnamparasports.com',
    },
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header bài viết */}
      <div className="bg-slate-50 dark:bg-slate-950 py-12 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600 dark:text-slate-400 text-sm md:text-base mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500">
                {post.author?.fullName?.charAt(0) || "A"}
              </div>
              <span className="font-medium">{post.author?.fullName || "Quản trị viên"}</span>
            </div>
            <span>&bull;</span>
            <time dateTime={post.createdAt}>
              {new Date(post.createdAt).toLocaleDateString("vi-VN", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            {post.category && (
              <>
                <span>&bull;</span>
                <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider">
                  {post.category.name}
                </span>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <TextToSpeech textToRead={`${post.title}. ${post.content}`} />
            <BookmarkButton postId={post.id} />
            <ShareButton url={`${process.env.NEXTAUTH_URL || ''}/${locale}/news/${post.slug}`} title={post.title} />
          </div>
        </div>
      </div>

      {/* Nội dung bài viết */}
      <div className="container mx-auto px-4 max-w-4xl py-12">
        {post.thumbnail && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-lg aspect-video relative">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none prose-a:text-blue-600 hover:prose-a:text-blue-500" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 mr-2 flex items-center">Thẻ:</span>
            {post.tags.map((tag: any) => (
              <span key={tag.id} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-sm text-slate-600 dark:text-slate-400">
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Interaction (Comments & Bookmarks) */}
        <PostInteractions postId={post.id} />
      </div>
    </main>
  );
}

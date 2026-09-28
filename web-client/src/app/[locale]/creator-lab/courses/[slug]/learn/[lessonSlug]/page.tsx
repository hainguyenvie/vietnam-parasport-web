import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { notFound, redirect } from "next/navigation";
import MarkCompleteButton from "@/components/MarkCompleteButton";
import LessonPlayer from "@/components/LessonPlayer";
import DOMPurify from 'isomorphic-dompurify';
import { FileText, Download } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getLessonBySlug(slug: string) {
  try {
    const res = await apiClient.request(`/lessons/slug/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch lesson");
    }
    const data = await res.json();
    return data ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getCourse(slug: string) {
  try {
    const res = await apiClient.request(`/courses/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function checkEnrollment(courseId: string, accessToken: string) {
  try {
    const res = await apiClient.request(`/course-progress/${courseId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store'
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const [lesson, course] = await Promise.all([
    getLessonBySlug(lessonSlug),
    getCourse(slug),
  ]);

  if (!lesson || !course) notFound();

  const session = await getServerSession(authOptions);
  let isEnrolled = false;
  if (session && (session as any).accessToken) {
    isEnrolled = await checkEnrollment(course.id, (session as any).accessToken);
  }

  if (!isEnrolled) {
    redirect(`/creator-lab/courses/${slug}`);
  }

  // Compute lesson index and total across all chapters
  let lessonIndex = 0;
  let totalLessons = 0;
  if (course?.chapters) {
    const allLessons: any[] = [];
    for (const ch of course.chapters) {
      if (ch.lessons) allLessons.push(...ch.lessons);
    }
    totalLessons = allLessons.length;
    lessonIndex = allLessons.findIndex((l: any) => l.id === lesson.id || l.slug === lesson.slug);
    if (lessonIndex < 0) lessonIndex = 0;
  }

  // Parse documents safely in case it is stringified
  let extraDocuments: string[] = [];
  if (lesson.documents) {
    try {
      extraDocuments = typeof lesson.documents === 'string' ? JSON.parse(lesson.documents) : lesson.documents;
    } catch (e) {
      console.error("Failed to parse lesson documents", e);
    }
  }

  const getFilenameFromUrl = (url: string) => {
    try {
      if (url.includes('api/v1/media/view')) {
        const urlObj = new URL(url, 'http://localhost');
        const fileParam = urlObj.searchParams.get('file');
        if (fileParam) {
          return fileParam.split('/').pop()?.split('?')[0] || 'Tài liệu';
        }
      }
      return url.split('/').pop()?.split('?')[0] || 'Tài liệu';
    } catch {
      return url.split('/').pop()?.split('?')[0] || 'Tài liệu';
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white pb-12 flex flex-col">
      <LessonPlayer lesson={lesson} course={course} slug={slug} />
      <div className="container mx-auto px-4 max-w-5xl mt-8">
        <h2 className="text-3xl font-bold mb-6">{lesson.title}</h2>
        <div className="bg-slate-800 p-6 rounded-xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-slate-300">Hoàn thành bài giảng này để cập nhật tiến độ.</p>
          <MarkCompleteButton courseId={lesson.chapter?.courseId} lessonIndex={lessonIndex} totalLessons={totalLessons || 1} />
        </div>

        {/* Attachments Section */}
        {(lesson.documentUrl || extraDocuments.length > 0) && (
          <div className="bg-slate-800 p-6 rounded-xl mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-indigo-400" />
              Tài liệu đính kèm
            </h3>
            <div className="space-y-3">
              {lesson.documentUrl && (
                <a
                  href={lesson.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg flex-shrink-0">
                      <FileText size={20} />
                    </div>
                    <span className="font-medium text-slate-200 break-all line-clamp-1">
                      {getFilenameFromUrl(lesson.documentUrl)}
                    </span>
                  </div>
                  <Download size={18} className="text-slate-400 flex-shrink-0 ml-4" />
                </a>
              )}
              {extraDocuments.map((docUrl: string, idx: number) => (
                <a
                  key={idx}
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-600/50 text-slate-300 rounded-lg flex-shrink-0">
                      <FileText size={20} />
                    </div>
                    <span className="font-medium text-slate-200 break-all line-clamp-1">
                      {getFilenameFromUrl(docUrl)}
                    </span>
                  </div>
                  <Download size={18} className="text-slate-400 flex-shrink-0 ml-4" />
                </a>
              ))}
            </div>
          </div>
        )}

        {lesson.content && (
          <div
            className="prose prose-invert max-w-none bg-slate-800 p-8 rounded-xl"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content) }}
          />
        )}
      </div>
    </main>
  );
}

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import CourseEnrollmentSection from "@/components/CourseEnrollmentSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";

import Image from 'next/image';

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`;
  }
  return `${minutes} phút`;
}

async function getCourse(slug: string) {
  try {
    const res = await apiClient.request(`/courses/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch course");
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Không tìm thấy khóa học" };
  return {
    title: `${course.title} - VNParalympic`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const firstLesson = course.chapters?.[0]?.lessons?.[0];

  const learningObjectives = course.learningObjectives
    ? course.learningObjectives.split('\n').filter((line: string) => line.trim())
    : null;

  const requirements = course.requirements
    ? course.requirements.split('\n').filter((line: string) => line.trim())
    : null;

  const chapterCount = course.chapters?.length || 0;
  const lessonCount = course.lessonCount || 0;
  const totalDuration = course.totalDuration || 0;
  const enrolledCount = course.enrolledCount || 0;

  return (
    <main className="min-h-screen bg-background pb-20 animate-in fade-in duration-300">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <Link href="/creator-lab?tab=courses" className="text-primary-foreground/70 hover:text-primary-foreground mb-4 inline-block font-medium text-sm transition-colors">
              &larr; Khóa học khác
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{course.title}</h1>
            <div 
              className="text-lg text-primary-foreground/80 mb-6 max-w-2xl leading-relaxed [&>p]:mb-4 last:[&>p]:mb-0" 
              dangerouslySetInnerHTML={{ __html: course.description || '' }} 
            />
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge variant="secondary">{enrolledCount} học viên</Badge>
              <span className="text-sm text-primary-foreground/70">&bull;</span>
              <span className="text-sm text-primary-foreground/70">{chapterCount} chương &bull; {lessonCount} bài học</span>
              {totalDuration > 0 && (
                <>
                  <span className="text-sm text-primary-foreground/70">&bull;</span>
                  <span className="text-sm text-primary-foreground/70">{formatDuration(totalDuration)}</span>
                </>
              )}
            </div>
            <CourseEnrollmentSection
              courseId={course.id}
              courseSlug={course.slug}
              firstLessonId={firstLesson?.id}
              firstLessonSlug={firstLesson?.slug}
            />
          </div>
          {course.thumbnail && (
            <div className="w-full md:w-1/3 aspect-video md:aspect-square lg:aspect-video rounded-xl overflow-hidden shadow-2xl shrink-0 border-4 border-primary-foreground/20">
              <img src={course.thumbnail} alt={course.title} className="object-cover w-full h-full" />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl mt-12 space-y-12">

        {/* Bạn sẽ học được gì? */}
        {learningObjectives && learningObjectives.length > 0 && (
          <section>
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-6">
              Bạn sẽ học được gì?
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningObjectives.map((obj: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                      <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Nội dung khóa học */}
        <section>
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2">Nội dung khóa học</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {chapterCount} chương &bull; {lessonCount} bài học
            {totalDuration > 0 && <> &bull; {formatDuration(totalDuration)}</>}
          </p>

          {course.chapters?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Khóa học đang được cập nhật nội dung.
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {course.chapters?.map((chapter: any, index: number) => (
                <AccordionItem key={chapter.id} value={chapter.id}>
                  <AccordionTrigger className="text-base font-semibold px-4 hover:bg-accent/50 rounded-t-xl data-[state=open]:rounded-none transition-colors">
                    <span className="flex items-center gap-3">
                      Chương {index + 1}: {chapter.title}
                    </span>
                    <Badge variant="outline" className="ml-3 text-xs font-normal">
                      {chapter.lessons?.length || 0} bài
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="divide-y divide-border" role="list">
                      {chapter.lessons?.map((lesson: any, lIndex: number) => (
                        <li key={lesson.id}>
                          <Link
                            href={`/creator-lab/courses/${course.slug}/learn/${lesson.slug || lesson.id}`}
                            className="flex items-center gap-3 px-8 py-3 hover:bg-accent/30 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-sm flex-1 group-hover:text-primary transition-colors">
                              Bài {lIndex + 1}: {lesson.title}
                            </span>
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                      {(!chapter.lessons || chapter.lessons.length === 0) && (
                        <li className="px-8 py-4 text-sm text-muted-foreground">Đang cập nhật bài giảng</li>
                      )}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        {/* Yêu cầu */}
        {requirements && requirements.length > 0 && (
          <section>
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-6">Yêu cầu</h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3" role="list">
                  {requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                      <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold" aria-hidden="true">
                        {i + 1}
                      </div>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

      </div>
    </main>
  );
}

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Mocking STT & TTS Processing.
   * In a real implementation, this would trigger a Google Cloud Video Intelligence API
   * or Google Cloud Speech-to-Text and Text-to-Speech API.
   */
  async processVideoAccessibility(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    this.logger.log(`Starting mock STT/TTS processing for lesson ${lessonId}`);

    // Mock wait time to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockVttUrl = `/uploads/mock-subtitles-${lessonId}.vtt`;
    const mockAudioDescUrl = `/uploads/mock-audiodesc-${lessonId}.mp3`;

    const updatedLesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        vttUrl: mockVttUrl,
        audioDescUrl: mockAudioDescUrl,
      },
    });

    this.logger.log(`Completed mock STT/TTS processing for lesson ${lessonId}`);

    return {
      message: "Processed successfully",
      lesson: updatedLesson,
    };
  }
}

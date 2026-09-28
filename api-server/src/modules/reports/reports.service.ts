import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import type { Response } from "express";
import { REPORT_QUEUE } from "./reports.constants";

@Injectable()
export class ReportsService {
  constructor(@InjectQueue(REPORT_QUEUE) private reportsQueue: Queue) {}

  async exportTournamentExcel(tournamentId: string) {
    const job = await this.reportsQueue.add("excel", {
      type: "excel",
      tournamentId,
    });
    return { jobId: job.id, status: "queued" };
  }

  async exportTournamentPdf(tournamentId: string) {
    const job = await this.reportsQueue.add("pdf", {
      type: "pdf",
      tournamentId,
    });
    return { jobId: job.id, status: "queued" };
  }

  async getJobStatus(jobId: string) {
    const job = await this.reportsQueue.getJob(jobId);
    if (!job) throw new NotFoundException("Job not found");

    const state = await job.getState();
    const result = job.returnvalue;

    if (state === "completed" && result?.success) {
      return {
        status: "completed",
        filename: result.filename,
        contentType: result.contentType,
      };
    }

    if (state === "failed") {
      return { status: "failed", error: job.failedReason };
    }

    return { status: state };
  }

  async downloadJob(jobId: string, res: Response) {
    const job = await this.reportsQueue.getJob(jobId);
    if (!job) throw new NotFoundException("Job not found");

    const state = await job.getState();
    if (state !== "completed") {
      throw new NotFoundException("Job not completed yet");
    }

    const result = job.returnvalue;
    if (!result?.success || !result?.buffer) {
      throw new NotFoundException("Job result not available");
    }

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(Buffer.from(result.buffer));
  }
}

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { REPORT_QUEUE } from "./reports.constants";
import puppeteer from "puppeteer";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../../prisma/prisma.service";

export interface PdfJobData {
  type: "pdf";
  tournamentId: string;
  title: string;
}

export interface ExcelJobData {
  type: "excel";
  tournamentId: string;
  title: string;
}

type ReportJobData = PdfJobData | ExcelJobData;

export interface ReportJobResult {
  success: boolean;
  buffer?: Buffer;
  filename?: string;
  contentType?: string;
  error?: string;
}

@Processor(REPORT_QUEUE)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<ReportJobData>): Promise<ReportJobResult> {
    this.logger.log(`Processing report job ${job.id} of type ${job.data.type}`);

    switch (job.data.type) {
      case "pdf":
        return this.generatePdf(job.data);
      case "excel":
        return this.generateExcel(job.data);
      default:
        throw new Error(`Unknown report type`);
    }
  }

  private async generatePdf(data: PdfJobData): Promise<ReportJobResult> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      include: {
        rankings: {
          include: {
            athlete: { include: { user: { select: { fullName: true } } } },
            team: true,
          },
          orderBy: { rank: "asc" },
        },
        matches: { orderBy: { startTime: "asc" } },
      },
    });

    if (!tournament) return { success: false, error: "Tournament not found" };

    const htmlContent = this.buildPdfHtml(tournament, data.title);
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      return {
        success: true,
        buffer: Buffer.from(pdfBuffer),
        filename: `baocao-${data.tournamentId}.pdf`,
        contentType: "application/pdf",
      };
    } catch (err: any) {
      this.logger.error(`PDF generation failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  private async generateExcel(data: ExcelJobData): Promise<ReportJobResult> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      include: {
        rankings: {
          include: {
            athlete: { include: { user: { select: { fullName: true } } } },
            team: true,
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!tournament) return { success: false, error: "Tournament not found" };

    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Bảng xếp hạng");
      ws.columns = [
        { header: "Hạng", key: "rank", width: 8 },
        { header: "Vận động viên / Đội", key: "name", width: 40 },
        { header: "Điểm", key: "points", width: 10 },
        { header: "Trạng thái", key: "status", width: 12 },
      ];

      for (const r of tournament.rankings) {
        ws.addRow({
          rank: r.rank,
          name: r.athlete?.user?.fullName || r.team?.name || "N/A",
          points: r.points,
          status: r.status,
        });
      }

      ws.getRow(1).font = { bold: true };
      const buffer = await wb.xlsx.writeBuffer();
      return {
        success: true,
        buffer: Buffer.from(buffer),
        filename: `bang-xep-hang-${data.tournamentId}.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private buildPdfHtml(tournament: any, title: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${this.escape(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #2563eb; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
      </style></head><body>
      <h1>${this.escape(title)}</h1>
      <p>Địa điểm: ${this.escape(tournament.location || "N/A")}</p>
      <p>Ngày: ${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString("vi-VN") : "N/A"}</p>
      <table><tr><th>Hạng</th><th>VĐV/Đội</th><th>Điểm</th></tr>
      ${
        tournament.rankings
          ?.map(
            (r: any, i: number) =>
              `<tr><td>${i + 1}</td><td>${this.escape(r.athlete?.user?.fullName || r.team?.name || "N/A")}</td><td>${r.points || 0}</td></tr>`
          )
          .join("") || ""
      }
      </table></body></html>`;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

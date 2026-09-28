import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(createTournamentDto: CreateTournamentDto) {
    let slug = createTournamentDto.slug;
    if (!slug) {
      slug = this.slugify(createTournamentDto.name);
    }

    // Check for duplicate slug
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.prisma.tournament.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const data = { ...createTournamentDto, slug: uniqueSlug } as any;

    return this.prisma.tournament.create({
      data,
    });
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "a")
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "e")
      .replace(/i|í|ì|ỉ|ĩ|ị/gi, "i")
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "o")
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "u")
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, "y")
      .replace(/đ/gi, "d")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  async findAll(params?: {
    page?: string;
    limit?: string;
    status?: string;
    sportId?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    weightClass?: string;
    classificationId?: string;
  }) {
    const conditions: any[] = [];

    if (params?.status && params.status !== "all") {
      conditions.push({ status: params.status });
    }
    if (params?.location) {
      conditions.push({
        location: { contains: params.location, mode: "insensitive" },
      });
    }
    if (params?.startDate) {
      conditions.push({ startDate: { gte: new Date(params.startDate) } });
    }
    if (params?.endDate) {
      conditions.push({ endDate: { lte: new Date(params.endDate) } });
    }

    // Build sport/weightClass/classificationId into a combined matches filter
    const matchesFilter: any = {};
    if (params?.sportId) {
      const sportIds = params.sportId.split(",").filter(Boolean);
      if (sportIds.length > 0) matchesFilter.sportId = { in: sportIds };
    }
    if (params?.weightClass) {
      matchesFilter.event = {
        name: { contains: params.weightClass, mode: "insensitive" },
      };
    }
    if (params?.classificationId) {
      const classIds = params.classificationId.split(",").filter(Boolean);
      if (classIds.length > 0) matchesFilter.classificationId = { in: classIds };
    }

    if (Object.keys(matchesFilter).length > 0) {
      const orConditions: any[] = [{ matches: { some: matchesFilter } }];
      // Only include subTournaments if only sportId is being filtered
      // (weightClass and classificationId don't apply to subTournaments)
      if (params?.sportId && !params?.weightClass && !params?.classificationId) {
        const sportIds = params.sportId.split(",").filter(Boolean);
        orConditions.push({
          subTournaments: { some: { sportId: { in: sportIds } } },
        });
      }
      conditions.push(orConditions.length === 1 ? orConditions[0] : { OR: orConditions });
    }

    const where: any = conditions.length > 0 ? { AND: conditions } : {};

    const query: any = {
      where,
      orderBy: { startDate: "asc" },
    };

    if (params?.page && params?.limit) {
      const page = parseInt(params.page, 10);
      const limit = parseInt(params.limit, 10);
      query.skip = (page - 1) * limit;
      query.take = limit;

      const [data, total] = await Promise.all([
        this.prisma.tournament.findMany(query),
        this.prisma.tournament.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return this.prisma.tournament.findMany(query);
  }

  async findOne(id: string) {
    const t = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: { sport: true },
          orderBy: { startTime: "asc" },
        },
        rankings: {
          include: {
            athlete: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
                sport: true,
              },
            },
          },
          orderBy: { points: "desc" },
        },
      },
    });
    if (!t) throw new NotFoundException();
    return t;
  }

  update(id: string, updateTournamentDto: UpdateTournamentDto) {
    return this.prisma.tournament.update({
      where: { id },
      data: updateTournamentDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.tournament.delete({
      where: { id },
    });
  }

  // Quản lý Vận động viên/Đội tham gia (Ranking)
  async addParticipant(
    tournamentId: string,
    data: { athleteId?: string; teamId?: string; seed?: number }
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Không tìm thấy giải đấu");

    const seed = data.seed ? parseInt(data.seed.toString(), 10) : null;

    if (tournament.participantType === "TEAM") {
      if (!data.teamId) {
        throw new BadRequestException("Vui lòng chọn đội tuyển");
      }

      // Check if team already in tournament
      const existingTeam = await this.prisma.ranking.findFirst({
        where: { tournamentId, teamId: data.teamId },
      });
      if (existingTeam) {
        throw new BadRequestException("Đội này đã tham gia giải đấu");
      }

      const team = await this.prisma.team.findUnique({
        where: { id: data.teamId },
      });
      if (!team) throw new NotFoundException("Đội không tồn tại");
      if (!team.sportId) throw new BadRequestException("Đội này chưa có thông tin môn thể thao");

      return this.prisma.ranking.create({
        data: {
          tournamentId,
          sportId: team.sportId,
          teamId: data.teamId,
          seed,
          rank: 0,
          points: 0,
          status: "ACTIVE",
        },
      });
    } else {
      if (!data.athleteId) throw new BadRequestException("Cần chọn VĐV");
      // Lookup athlete profile to get sportId
      const athlete = await this.prisma.athleteProfile.findUnique({
        where: { id: data.athleteId },
      });

      if (!athlete) {
        throw new NotFoundException("Không tìm thấy Vận động viên");
      }

      // Check if athlete already in tournament
      const existing = await this.prisma.ranking.findFirst({
        where: { tournamentId, athleteId: data.athleteId },
      });
      if (existing) {
        throw new BadRequestException("Vận động viên này đã tham gia giải đấu");
      }
      return this.prisma.ranking.create({
        data: {
          tournamentId,
          athleteId: data.athleteId,
          sportId: athlete.sportId,
          seed,
          rank: 0,
          points: 0,
          status: "ACTIVE",
        },
      });
    }
  }

  async updateParticipantStatus(tournamentId: string, rankingId: string, status: any) {
    const ranking = await this.prisma.ranking.findFirst({
      where: { id: rankingId, tournamentId },
    });
    if (!ranking) throw new NotFoundException("Không tìm thấy VĐV trong giải đấu này");
    return this.prisma.ranking.update({
      where: { id: ranking.id },
      data: { status },
    });
  }

  async updateParticipantCheckIn(tournamentId: string, rankingId: string, hasCheckedIn: boolean) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Không tìm thấy giải đấu");
    if (tournament.status !== "UPCOMING" && tournament.status !== "ONGOING") {
      throw new BadRequestException(
        `Không thể điểm danh khi giải đấu đang ở trạng thái ${tournament.status}`
      );
    }

    const ranking = await this.prisma.ranking.findFirst({
      where: { id: rankingId, tournamentId },
    });
    if (!ranking) throw new NotFoundException("Không tìm thấy VĐV trong giải đấu này");
    return this.prisma.ranking.update({
      where: { id: ranking.id },
      data: { hasCheckedIn },
    });
  }

  async removeParticipant(tournamentId: string, rankingId: string) {
    const ranking = await this.prisma.ranking.findFirst({
      where: { id: rankingId, tournamentId },
    });
    if (!ranking) throw new NotFoundException("Không tìm thấy VĐV trong giải đấu này");
    return this.prisma.ranking.delete({
      where: { id: ranking.id },
    });
  }

  async getAvailableDates(params?: { sportId?: string }) {
    const where: any = {};
    if (params?.sportId) {
      const sportIds = params.sportId.split(",").filter(Boolean);
      if (sportIds.length > 0) {
        where.OR = [
          { matches: { some: { sportId: { in: sportIds } } } },
          { subTournaments: { some: { sportId: { in: sportIds } } } },
        ];
      }
    }
    const tournaments = await this.prisma.tournament.findMany({
      where,
      select: { startDate: true, endDate: true },
    });
    const dates = new Set<string>();
    const MAX_DAYS = 365;
    tournaments.forEach((t) => {
      if (!t.startDate) return;
      const start = new Date(t.startDate);
      const end = t.endDate ? new Date(t.endDate) : start;
      let count = 0;
      for (let d = new Date(start); d <= end && count < MAX_DAYS; d.setDate(d.getDate() + 1)) {
        dates.add(d.toISOString().slice(0, 10));
        count++;
      }
    });
    return Array.from(dates).sort();
  }
}

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CreateAthleteAchievementDto } from "./dto/create-athlete-achievement.dto";
import { UpdateAthleteAchievementDto } from "./dto/update-athlete-achievement.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AthleteAchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAthleteAchievementDto: CreateAthleteAchievementDto) {
    return this.prisma.athleteAchievement.create({
      data: createAthleteAchievementDto,
    });
  }

  // VĐV tự tạo
  async createByUser(userId: string, createAthleteAchievementDto: CreateAthleteAchievementDto) {
    const profile = await this.prisma.athleteProfile.findFirst({
      where: { userId },
    });
    if (!profile) throw new UnauthorizedException("Không tìm thấy hồ sơ VĐV");

    return this.prisma.athleteAchievement.create({
      data: {
        ...createAthleteAchievementDto,
        athleteId: profile.id,
        isVerified: false, // User tự tạo thì chưa xác thực
      },
    });
  }

  findAll(athleteId?: string) {
    if (athleteId) {
      return this.prisma.athleteAchievement.findMany({
        where: { athleteId },
        include: { tournament: true, event: true, classification: true },
      });
    }
    return this.prisma.athleteAchievement.findMany({
      include: { tournament: true, event: true, classification: true },
    });
  }

  findOne(id: string) {
    return this.prisma.athleteAchievement.findUnique({
      where: { id },
      include: { tournament: true, event: true, classification: true },
    });
  }

  update(id: string, updateAthleteAchievementDto: UpdateAthleteAchievementDto) {
    return this.prisma.athleteAchievement.update({
      where: { id },
      data: updateAthleteAchievementDto,
    });
  }

  remove(id: string) {
    return this.prisma.athleteAchievement.delete({ where: { id } });
  }

  async toggleFeature(id: string, userId: string) {
    const achievement = await this.prisma.athleteAchievement.findUnique({
      where: { id },
      include: { athlete: { select: { userId: true } } },
    });
    if (!achievement) throw new NotFoundException("Không tìm thấy thành tích.");
    if (achievement.athlete.userId !== userId) throw new ForbiddenException("Không có quyền.");

    if (!achievement.isFeatured) {
      const featuredCount = await this.prisma.athleteAchievement.count({
        where: { athleteId: achievement.athleteId, isFeatured: true },
      });
      if (featuredCount >= 3) {
        throw new ForbiddenException("Tối đa 3 thành tích nổi bật.");
      }
    }

    return this.prisma.athleteAchievement.update({
      where: { id },
      data: { isFeatured: !achievement.isFeatured },
    });
  }
}

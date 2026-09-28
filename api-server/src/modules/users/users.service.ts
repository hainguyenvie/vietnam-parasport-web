import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { User, Prisma } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async createAdminUser(data: { email: string; fullName: string; createdAt?: Date }) {
    const role = await this.prisma.role.findUnique({ where: { name: "USER" } });
    if (!role) throw new BadRequestException("Role USER not found");
    return this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        role: { connect: { id: role.id } },
        ...(data.createdAt ? { createdAt: data.createdAt } : {}),
      },
      include: { role: true },
    });
  }

  async createAdminUsers(users: Array<{ email: string; fullName: string; createdAt?: string }>) {
    const role = await this.prisma.role.findUnique({ where: { name: "USER" } });
    if (!role) throw new BadRequestException("Role USER not found");
    const result = await this.prisma.user.createMany({
      data: users.map((user) => ({
        email: user.email,
        fullName: user.fullName,
        roleId: role.id,
        ...(user.createdAt ? { createdAt: new Date(user.createdAt) } : {}),
      })),
      skipDuplicates: true,
    });
    return { created: result.count };
  }

  async updateCreatedAt(id: string, createdAt: Date) {
    return this.prisma.user.update({
      where: { id },
      data: { createdAt },
    });
  }

  async bulkUpdateCreatedAt(updates: Array<{ id: string; createdAt: string }>) {
    await this.prisma.$transaction(
      updates.map((item) =>
        this.prisma.user.update({
          where: { id: item.id },
          data: { createdAt: new Date(item.createdAt) },
        })
      )
    );
    return { updated: updates.length };
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        createdAt: true,
        phoneNumber: true,
        dob: true,
        gender: true,
        address: true,
        bio: true,
        isTwoFactorEnabled: true,
        progress: {
          include: { course: { select: { title: true, slug: true } } },
        },
        athleteProfiles: {
          include: {
            sport: true,
            classification: true,
          },
        },
        coachProfile: {
          include: {
            sport: true,
          },
        },
        assistantProfile: {
          include: {
            athlete: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });
  }

  async updateProfile(
    id: string,
    data: {
      fullName?: string;
      avatarUrl?: string;
      coverUrl?: string;
      phoneNumber?: string;
      dob?: Date | string;
      gender?: string;
      address?: string;
      bio?: string;
    }
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        phoneNumber: true,
        dob: true,
        gender: true,
        address: true,
        bio: true,
      },
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          isActive: true,
          gender: true,
          dob: true,
          phoneNumber: true,
          athleteProfiles: {
            include: {
              sport: true,
              classification: true,
            },
          },
          coachProfile: {
            include: {
              sport: true,
            },
          },
          assistantProfile: {
            include: {
              athlete: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRoles() {
    return this.prisma.role.findMany();
  }

  async updateRole(id: string, roleId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { roleId },
      include: { role: true },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  // Profile Management
  async getAthleteProfile(id: string) {
    return this.prisma.athleteProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        sport: true,
      },
    });
  }

  async getAllAthletes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.athleteProfile.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          sport: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.athleteProfile.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async upsertAthleteProfile(profileId: string, userId: string, data: any) {
    // Verify profile belongs to user
    const profile = await this.prisma.athleteProfile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) {
      // Create new profile for this user + sport
      return this.prisma.athleteProfile.create({
        data: {
          ...data,
          userId,
        },
      });
    }
    return this.prisma.athleteProfile.update({
      where: { id: profileId },
      data,
    });
  }

  async getCoachProfile(userId: string) {
    return this.prisma.coachProfile.findUnique({
      where: { userId },
      include: { sport: true },
    });
  }

  async upsertCoachProfile(userId: string, data: any) {
    return this.prisma.coachProfile.upsert({
      where: { userId },
      update: data,
      create: {
        ...data,
        userId,
      },
    });
  }

  async getAssistantProfile(userId: string) {
    return this.prisma.assistantProfile.findUnique({
      where: { userId },
      include: {
        athlete: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });
  }

  async upsertAssistantProfile(userId: string, data: any) {
    return this.prisma.assistantProfile.upsert({
      where: { userId },
      update: data,
      create: {
        ...data,
        userId,
      },
    });
  }

  async enable2FA(id: string, secret: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        twoFactorSecret: secret,
        isTwoFactorEnabled: true,
      },
    });
  }

  async disable2FA(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        twoFactorSecret: null,
        isTwoFactorEnabled: false,
      },
    });
  }

  async createAuditLog(
    userId: string,
    action: string,
    entityId: string,
    details: any,
    ipAddress?: string
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityId,
        details: details || {},
        ipAddress,
      },
    });
  }

  async getRecentAudits() {
    return this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getAllAudits(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async upgradeToAthlete(userId: string, sportId?: string, organizationId?: string) {
    const sport = sportId
      ? await this.prisma.sport.findUnique({ where: { id: sportId } })
      : await this.prisma.sport.findFirst();

    const defaultDisability = await this.prisma.disabilityType.findFirst();

    if (!sport || !defaultDisability) {
      throw new BadRequestException(
        "Dữ liệu môn thể thao hoặc phân loại khuyết tật mặc định chưa được cấu hình."
      );
    }

    // Check if user already has a profile for this sport
    const existing = await this.prisma.athleteProfile.findFirst({
      where: { userId, sportId: sport.id },
    });

    if (existing) {
      return { success: true, message: "Đã có hồ sơ VĐV cho môn này.", profile: existing };
    }

    const profile = await this.prisma.athleteProfile.create({
      data: {
        userId,
        sportId: sport.id,
        disabilityId: defaultDisability.id,
        organizationId: organizationId || undefined,
      },
    });

    return { success: true, profile };
  }

  async upgradeToCoach(userId: string) {
    const existing = await this.prisma.coachProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      const defaultSport = await this.prisma.sport.findFirst();
      if (!defaultSport) {
        throw new BadRequestException("Dữ liệu môn thể thao mặc định chưa được cấu hình.");
      }

      await this.prisma.coachProfile.create({
        data: {
          userId,
          sportId: defaultSport.id,
        },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (
      user &&
      user.role.name !== "INSTRUCTOR" &&
      user.role.name !== "ADMIN" &&
      user.role.name !== "SUPER_ADMIN"
    ) {
      const instructorRole = await this.prisma.role.findUnique({
        where: { name: "INSTRUCTOR" },
      });
      if (instructorRole) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { roleId: instructorRole.id },
        });
      }
    }

    return { success: true };
  }

  async getAdminStats() {
    const [users, posts, courses, comments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.course.count(),
      this.prisma.comment.count(),
    ]);
    return { users, posts, courses, comments };
  }

  // === Public Profile (no auth) ===

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        createdAt: true,
        role: { select: { name: true } },
        athleteProfiles: {
          include: {
            sport: { select: { nameVi: true, nameEn: true, slug: true, icon: true } },
            classification: { select: { code: true, description: true } },
            organization: { select: { name: true, imageUrl: true } },
          },
        },
        coachProfile: {
          include: {
            sport: { select: { nameVi: true, nameEn: true, slug: true, icon: true } },
          },
        },
        assistantProfile: true,
      },
    });

    if (!user) return null;

    const result: any = {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      role: user.role.name,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    // AthleteProfiles (multiple)
    if (user.athleteProfiles?.length) {
      result.athleteProfiles = user.athleteProfiles.map((ap) => ({
        id: ap.id,
        sport: ap.sport,
        classification: ap.classification,
        organization: ap.organization
          ? { name: ap.organization.name, logoUrl: ap.organization.imageUrl }
          : null,
      }));

      // Collect all profile IDs for aggregation
      const profileIds = user.athleteProfiles.map((ap) => ap.id);

      // Achievement count + latest 3 across all profiles
      const [achievementCount, latestAchievements] = await Promise.all([
        this.prisma.athleteAchievement.count({
          where: { athleteId: { in: profileIds } },
        }),
        this.prisma.athleteAchievement.findMany({
          where: { athleteId: { in: profileIds } },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            tournament: { select: { id: true, name: true, slug: true } },
            event: { select: { id: true, name: true } },
            classification: { select: { code: true, description: true } },
          },
        }),
      ]);
      result.achievements = {
        count: achievementCount,
        latest: latestAchievements,
      };

      // Tournament count via rankings across all profiles
      const tournamentCount = await this.prisma.ranking.count({
        where: { athleteId: { in: profileIds } },
      });
      result.tournamentCount = tournamentCount;

      // Affiliate stats across all profiles
      const affiliateStats = await this.prisma.affiliateLink.aggregate({
        where: { athleteId: { in: profileIds }, isActive: true },
        _count: true,
        _sum: { clickCount: true },
      });
      result.affiliateLinks = {
        count: affiliateStats._count,
        totalClicks: affiliateStats._sum.clickCount || 0,
      };

      // Backward compat: expose first profile as athleteProfile
      result.athleteProfile = result.athleteProfiles[0];
    }

    // CoachProfile
    if (user.coachProfile) {
      const cp = user.coachProfile;
      result.coachProfile = {
        sport: cp.sport,
        specialty: cp.specialty,
        experienceYears: cp.experienceYears,
        certificateUrl: cp.certificateUrl,
        isVerified: cp.isVerified,
        socialLinks: {
          facebookUrl: cp.facebookUrl,
          zaloUrl: cp.zaloUrl,
          tiktokUrl: cp.tiktokUrl,
        },
      };
    }

    // AssistantProfile
    if (user.assistantProfile) {
      result.assistantProfile = {
        supportArea: user.assistantProfile.supportArea,
        isVerified: user.assistantProfile.isVerified,
      };
    }

    return result;
  }

  async getUserAchievements(athleteId: string, page = "1", limit = "20") {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const profiles = await this.prisma.athleteProfile.findMany({
      where: { userId: athleteId },
      select: { id: true },
    });
    if (!profiles.length) return null;

    const profileIds = profiles.map((p) => p.id);

    const [data, total] = await Promise.all([
      this.prisma.athleteAchievement.findMany({
        where: { athleteId: { in: profileIds } },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          tournament: { select: { id: true, name: true, slug: true } },
          event: { select: { id: true, name: true } },
          classification: { select: { code: true, description: true } },
        },
      }),
      this.prisma.athleteAchievement.count({ where: { athleteId: { in: profileIds } } }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getUserTournaments(athleteId: string) {
    const profiles = await this.prisma.athleteProfile.findMany({
      where: { userId: athleteId },
      select: { id: true },
    });
    if (!profiles.length) return null;

    const profileIds = profiles.map((p) => p.id);

    const rankings = await this.prisma.ranking.findMany({
      where: { athleteId: { in: profileIds } },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
            endDate: true,
            location: true,
            bannerUrl: true,
            status: true,
          },
        },
        sport: { select: { nameVi: true, nameEn: true, slug: true, icon: true } },
        classification: { select: { code: true, description: true } },
      },
      orderBy: { rank: "asc" },
    });

    return rankings;
  }

  async getUserClubs(athleteId: string) {
    const profiles = await this.prisma.athleteProfile.findMany({
      where: { userId: athleteId },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            type: true,
            location: true,
            description: true,
          },
        },
      },
    });

    if (!profiles.length) return null;
    return profiles.map((p) => p.organization).filter(Boolean);
  }

  async getUserCompanions(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        athleteProfiles: { select: { id: true } },
        assistantProfile: { select: { id: true, athleteId: true } },
      },
    });

    if (!user) return null;

    if (user.athleteProfiles?.length) {
      const profileIds = user.athleteProfiles.map((p) => p.id);
      const assistants = await this.prisma.assistantProfile.findMany({
        where: { athleteId: { in: profileIds } },
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
        },
      });

      return {
        companions: assistants.map((a) => ({
          id: a.userId,
          fullName: a.user.fullName,
          avatarUrl: a.user.avatarUrl,
          supportArea: a.supportArea,
        })),
        type: "athlete",
      };
    }

    if (user.assistantProfile?.athleteId) {
      const athlete = await this.prisma.athleteProfile.findUnique({
        where: { id: user.assistantProfile.athleteId },
        include: {
          user: { select: { fullName: true } },
          sport: { select: { nameVi: true, nameEn: true } },
        },
      });

      if (!athlete) {
        return { companions: [], type: "assistant" };
      }

      return {
        companions: [
          {
            id: athlete.userId,
            fullName: athlete.user.fullName,
            sport: athlete.sport,
          },
        ],
        type: "assistant",
      };
    }

    return { companions: [], type: "assistant" };
  }

  async getUserSponsors(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        athleteProfiles: {
          select: {
            organization: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                type: true,
                location: true,
                description: true,
              },
            },
          },
        },
      },
    });

    const partners = await this.prisma.partner.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        website: true,
      },
    });

    return {
      organizations: user?.athleteProfiles?.map((p) => p.organization).filter(Boolean) ?? [],
      partners,
    };
  }

  async getMyStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        _count: {
          select: { posts: true, comments: true, bookmarks: true, reviews: true, orders: true },
        },
        progress: { select: { progressPct: true, isCompleted: true } },
        athleteProfiles: {
          select: {
            id: true,
            rankings: { select: { id: true } },
            athleteAchievements: {
              select: { medal: true, isVerified: true },
            },
            affiliateLinks: {
              select: { id: true, isActive: true, clickCount: true },
            },
            commissions: {
              select: { commissionAmount: true, status: true },
            },
          },
        },
        coachProfile: {
          select: { experienceYears: true, specialty: true, isVerified: true },
        },
        assistantProfile: {
          select: { supportArea: true, isVerified: true },
        },
      },
    });
    if (!user) throw new Error("User not found");

    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);

    const coursesEnrolled = user.progress.length;
    const coursesCompleted = user.progress.filter((p) => p.isCompleted).length;
    const avgProgress =
      coursesEnrolled > 0
        ? Math.round(user.progress.reduce((s, p) => s + p.progressPct, 0) / coursesEnrolled)
        : 0;

    const base = {
      postsCount: user._count.posts,
      commentsCount: user._count.comments,
      bookmarksCount: user._count.bookmarks,
      reviewsCount: user._count.reviews,
      ordersCount: user._count.orders,
      coursesEnrolled,
      coursesCompleted,
      avgProgress,
      accountAge,
    };

    // Athlete stats (aggregate across all athlete profiles)
    if (user.athleteProfiles.length > 0) {
      const allAchievements = user.athleteProfiles.flatMap((p) => p.athleteAchievements);
      const allLinks = user.athleteProfiles.flatMap((p) => p.affiliateLinks);
      const allCommissions = user.athleteProfiles.flatMap((p) => p.commissions);

      const goldMedals = allAchievements.filter((a) => a.medal === "GOLD").length;
      const silverMedals = allAchievements.filter((a) => a.medal === "SILVER").length;
      const bronzeMedals = allAchievements.filter((a) => a.medal === "BRONZE").length;

      return {
        ...base,
        roleType: "athlete",
        achievementsCount: allAchievements.length,
        verifiedAchievements: allAchievements.filter((a) => a.isVerified).length,
        goldMedals,
        silverMedals,
        bronzeMedals,
        tournamentsCount: user.athleteProfiles.reduce((s, p) => s + p.rankings.length, 0),
        affiliateLinksCount: allLinks.length,
        activeLinksCount: allLinks.filter((l) => l.isActive).length,
        totalClicks: allLinks.reduce((s, l) => s + l.clickCount, 0),
        totalEarnings: allCommissions.reduce((s, c) => s + c.commissionAmount, 0),
      };
    }

    // Coach stats
    if (user.coachProfile) {
      return {
        ...base,
        roleType: "coach",
        experienceYears: user.coachProfile.experienceYears,
        specialty: user.coachProfile.specialty,
        isVerified: user.coachProfile.isVerified,
      };
    }

    // Assistant stats
    if (user.assistantProfile) {
      return {
        ...base,
        roleType: "assistant",
        supportArea: user.assistantProfile.supportArea,
        isVerified: user.assistantProfile.isVerified,
      };
    }

    return { ...base, roleType: "user" };
  }

  async getMyActivity(userId: string, limit: number = 10) {
    const [audits, commissions, links, progress] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { action: true, details: true, createdAt: true },
      }),
      this.prisma.commission.findMany({
        where: {
          athlete: { userId },
          status: { in: ["APPROVED", "PAID"] },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          commissionAmount: true,
          status: true,
          createdAt: true,
          link: { select: { title: true } },
        },
      }),
      this.prisma.affiliateLink.findMany({
        where: { athlete: { userId } },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { title: true, createdAt: true },
      }),
      this.prisma.userCourseProgress.findMany({
        where: { userId, isCompleted: true },
        orderBy: { courseId: "desc" },
        take: limit,
        select: { course: { select: { title: true } } },
      }),
    ]);

    const items: { type: string; date: Date; textVi: string; textEn: string }[] = [];

    for (const a of audits) {
      items.push({
        type: "profile_updated",
        date: a.createdAt,
        textVi: "Đã cập nhật hồ sơ",
        textEn: "Updated profile",
      });
    }

    for (const c of commissions) {
      items.push({
        type: "commission",
        date: c.createdAt,
        textVi: `Nhận hoa hồng ${c.commissionAmount.toLocaleString("vi-VN")} VNĐ${c.link?.title ? ` từ "${c.link.title}"` : ""}`,
        textEn: `Earned ${c.commissionAmount.toLocaleString("en-US")} VND commission${c.link?.title ? ` from "${c.link.title}"` : ""}`,
      });
    }

    for (const l of links) {
      items.push({
        type: "link_created",
        date: l.createdAt,
        textVi: `Đã tạo link tiếp thị "${l.title}"`,
        textEn: `Created affiliate link "${l.title}"`,
      });
    }

    for (const p of progress) {
      items.push({
        type: "course_completed",
        date: new Date(),
        textVi: `Hoàn thành khóa học "${p.course.title}"`,
        textEn: `Completed course "${p.course.title}"`,
      });
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }
}

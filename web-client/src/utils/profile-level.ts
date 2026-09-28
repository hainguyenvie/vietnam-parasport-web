interface XPInput {
  achievementsGold: number;
  achievementsSilver: number;
  achievementsBronze: number;
  coursesCompleted: number;
  postsCount: number;
  affiliateTotalEarnings: number;
  accountAgeDays: number;
}

interface LevelInfo {
  xp: number;
  level: number;
  xpCurrent: number;
  xpToNext: number;
  xpProgress: number;
}

export interface BadgeInfo {
  id: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  icon: string;
  unlocked: boolean;
}

export function computeLevel(input: XPInput): LevelInfo {
  const xp =
    input.achievementsGold * 50 +
    input.achievementsSilver * 30 +
    input.achievementsBronze * 20 +
    input.coursesCompleted * 25 +
    input.postsCount * 5 +
    Math.floor(input.affiliateTotalEarnings / 10000) +
    input.accountAgeDays * 1;

  const level = Math.floor(Math.sqrt(xp / 100));
  const xpCurrent = level * level * 100;
  const xpToNext = (level + 1) * (level + 1) * 100;
  const xpProgress = Math.round(((xp - xpCurrent) / (xpToNext - xpCurrent)) * 100);

  return { xp, level, xpCurrent, xpToNext, xpProgress };
}

const BADGE_DEFS: Omit<BadgeInfo, "unlocked">[] = [
  { id: "course_1", nameVi: "Học viên", nameEn: "Student", descVi: "Hoàn thành khóa học đầu tiên", descEn: "Complete your first course", icon: "📚" },
  { id: "course_5", nameVi: "Học giả", nameEn: "Scholar", descVi: "Hoàn thành 5 khóa học", descEn: "Complete 5 courses", icon: "🎓" },
  { id: "achievement_1", nameVi: "VĐV", nameEn: "Athlete", descVi: "Đạt thành tích đầu tiên", descEn: "Earn your first achievement", icon: "🏅" },
  { id: "achievement_verified", nameVi: "Xác minh", nameEn: "Verified", descVi: "Có thành tích được xác minh", descEn: "Have a verified achievement", icon: "✅" },
  { id: "gold_1", nameVi: "Nhà vô địch", nameEn: "Champion", descVi: "Giành huy chương vàng", descEn: "Win a gold medal", icon: "🥇" },
  { id: "affiliate_earn", nameVi: "Kiếm tiền", nameEn: "Earner", descVi: "Kiếm được thu nhập affiliate đầu tiên", descEn: "Earn your first affiliate income", icon: "💰" },
  { id: "member_30", nameVi: "Thành viên", nameEn: "Member", descVi: "Thành viên 30 ngày", descEn: "Member for 30 days", icon: "⭐" },
  { id: "member_365", nameVi: "Kỳ cựu", nameEn: "Veteran", descVi: "Thành viên 1 năm", descEn: "Member for 1 year", icon: "👑" },
];

export function computeBadges(input: XPInput & { verifiedAchievements: number }): BadgeInfo[] {
  return BADGE_DEFS.map((def) => {
    let unlocked = false;
    switch (def.id) {
      case "course_1": unlocked = input.coursesCompleted >= 1; break;
      case "course_5": unlocked = input.coursesCompleted >= 5; break;
      case "achievement_1": unlocked = (input.achievementsGold + input.achievementsSilver + input.achievementsBronze) >= 1; break;
      case "achievement_verified": unlocked = input.verifiedAchievements >= 1; break;
      case "gold_1": unlocked = input.achievementsGold >= 1; break;
      case "affiliate_earn": unlocked = input.affiliateTotalEarnings > 0; break;
      case "member_30": unlocked = input.accountAgeDays >= 30; break;
      case "member_365": unlocked = input.accountAgeDays >= 365; break;
    }
    return { ...def, unlocked };
  });
}

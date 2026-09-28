import { PartialType } from "@nestjs/swagger";
import { CreateAthleteAchievementDto } from "./create-athlete-achievement.dto";

export class UpdateAthleteAchievementDto extends PartialType(CreateAthleteAchievementDto) {}

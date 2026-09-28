import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class CreateAthleteAchievementDto {
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @IsString()
  @IsOptional()
  tournamentId?: string;

  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  classificationId?: string;

  @IsString()
  @IsOptional()
  medal?: string;

  @IsString()
  @IsOptional()
  result?: string;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

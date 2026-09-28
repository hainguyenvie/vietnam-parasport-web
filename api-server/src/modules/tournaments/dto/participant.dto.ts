import { IsString, IsNotEmpty, IsEnum, IsOptional } from "class-validator";
import { RankingStatus } from "@prisma/client";

export class AddParticipantDto {
  @IsString()
  @IsOptional()
  athleteId?: string;

  @IsString()
  @IsOptional()
  teamId?: string;
}

export class UpdateParticipantStatusDto {
  @IsEnum(RankingStatus)
  @IsNotEmpty()
  status: RankingStatus;
}

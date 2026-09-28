import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class CreateOrUpdateRankingDto {
  @IsString() @IsNotEmpty() sportId!: string;
  @IsString() @IsNotEmpty() athleteId!: string;
  @IsNumber() @IsNotEmpty() rank!: number;
  @IsNumber() @IsOptional() points?: number;
  @IsString() @IsOptional() tournamentId?: string;
  @IsString() @IsOptional() eventId?: string;
  @IsString() @IsOptional() classificationId?: string;
}

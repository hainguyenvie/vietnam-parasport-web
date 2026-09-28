import { IsString, IsNotEmpty, IsDateString, IsOptional, IsBoolean } from "class-validator";

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  format?: string;

  @IsString()
  @IsOptional()
  participantType?: string;

  @IsBoolean()
  @IsOptional()
  holdThirdPlaceMatch?: boolean;

  @IsString()
  @IsOptional()
  bannerUrl?: string;
}

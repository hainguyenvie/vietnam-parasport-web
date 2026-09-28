import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  IsArray,
  Min,
} from "class-validator";

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty({ message: "Tên trận đấu không được để trống" })
  title: string;

  @IsString()
  @IsNotEmpty({ message: "ID Môn thể thao không được để trống" })
  sportId: string;

  @IsString()
  @IsOptional()
  tournamentId?: string;

  @IsString()
  @IsOptional()
  round?: string;

  @IsString()
  @IsOptional()
  videoStreamUrl?: string;

  @IsDateString({}, { message: "Thời gian bắt đầu không hợp lệ" })
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(MatchStatus, { message: "Trạng thái trận đấu không hợp lệ" })
  @IsOptional()
  status?: MatchStatus;

  @IsString()
  @IsOptional()
  result?: string;

  @IsString()
  @IsOptional()
  matchFormat?: string;

  @IsString()
  @IsOptional()
  group?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  bestOf?: number;

  @IsOptional()
  participants?: any;

  @IsString()
  @IsOptional()
  nextMatchId?: string;
}

import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum TournamentFormat {
  SINGLE_ELIMINATION = "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION = "DOUBLE_ELIMINATION",
  ROUND_ROBIN = "ROUND_ROBIN",
}

export enum ParticipantType {
  INDIVIDUAL = "INDIVIDUAL",
  TEAM = "TEAM",
  MIXED = "MIXED",
  PAIR = "PAIR",
}

export class CreateSubTournamentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sportId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  classificationId?: string;

  @ApiProperty({
    enum: TournamentFormat,
    default: TournamentFormat.SINGLE_ELIMINATION,
  })
  @IsEnum(TournamentFormat)
  @IsOptional()
  format?: string;

  @ApiProperty({ enum: ParticipantType, default: ParticipantType.INDIVIDUAL })
  @IsEnum(ParticipantType)
  @IsOptional()
  participantType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  minAge?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  maxAge?: number;
}

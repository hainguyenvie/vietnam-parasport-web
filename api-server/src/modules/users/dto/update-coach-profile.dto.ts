import { IsString, IsOptional, IsInt, Min, IsUrl, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateCoachProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sportId?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  achievements?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  certificateUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  facebookUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  zaloUrl?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  tiktokUrl?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

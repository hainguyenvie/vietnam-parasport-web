import { IsString, IsOptional, IsInt, Min, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAthleteProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sportId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  disabilityId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  achievements?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  rank?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  classificationId?: string;

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
}

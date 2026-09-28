import { IsString, IsOptional, IsUrl, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAssistantProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  athleteId?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  medicalCertUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  medicalDesc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  supportArea?: string;

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

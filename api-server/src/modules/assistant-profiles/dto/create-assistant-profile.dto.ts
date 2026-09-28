import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAssistantProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  athleteId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  medicalCertUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  medicalDesc?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

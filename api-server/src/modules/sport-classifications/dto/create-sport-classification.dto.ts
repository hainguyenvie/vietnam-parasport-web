import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class CreateSportClassificationDto {
  @IsString()
  @IsNotEmpty()
  sportId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  medicalDesc?: string;

  @IsString()
  @IsOptional()
  disabilityCriteria?: string;

  @IsBoolean()
  @IsOptional()
  requiresAssistant?: boolean;
}

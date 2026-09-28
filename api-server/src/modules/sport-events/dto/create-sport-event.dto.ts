import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum } from "class-validator";

export class CreateSportEventDto {
  @IsString()
  @IsNotEmpty()
  sportId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsInt()
  @IsOptional()
  teamSize?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

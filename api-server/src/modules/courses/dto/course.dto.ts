import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from "class-validator";

export class CreateCourseDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() thumbnail?: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() learningObjectives?: string;
  @IsString() @IsOptional() requirements?: string;
}

export class UpdateCourseDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() thumbnail?: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() learningObjectives?: string;
  @IsString() @IsOptional() requirements?: string;
}

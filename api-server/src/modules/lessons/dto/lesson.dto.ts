import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class CreateLessonDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsOptional() chapterId?: string;
  @IsOptional() chapter?: any;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() videoUrl?: string;
  @IsString() @IsOptional() vttUrl?: string;
  @IsString() @IsOptional() documentUrl?: string;
  @IsOptional() documents?: any;
  @IsString() @IsOptional() content?: string;
  @IsNumber() @IsOptional() order?: number;
  @IsNumber() @IsOptional() duration?: number;
  @IsBoolean() @IsOptional() isPublished?: boolean;
}

export class UpdateLessonDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() videoUrl?: string;
  @IsString() @IsOptional() vttUrl?: string;
  @IsString() @IsOptional() documentUrl?: string;
  @IsOptional() documents?: any;
  @IsString() @IsOptional() content?: string;
  @IsNumber() @IsOptional() order?: number;
  @IsNumber() @IsOptional() duration?: number;
  @IsBoolean() @IsOptional() isPublished?: boolean;
}

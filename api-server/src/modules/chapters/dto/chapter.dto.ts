import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class CreateChapterDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsOptional() courseId?: string;
  @IsOptional() course?: any;
  @IsNumber() @IsOptional() order?: number;
}

export class UpdateChapterDto {
  @IsString() @IsOptional() title?: string;
  @IsNumber() @IsOptional() order?: number;
}

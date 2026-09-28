import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateQuizDto {
  @IsString() @IsNotEmpty() lessonId!: string;
  @IsString() @IsOptional() title?: string;
}

export class UpdateQuizDto {
  @IsString() @IsOptional() title?: string;
}

export class CreateQuizQuestionDto {
  @IsString() @IsNotEmpty() content!: string;
  @IsArray() @IsOptional() options?: string[];
  @IsNotEmpty() correctOption!: number;
  @IsString() @IsOptional() explanation?: string;
}

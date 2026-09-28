import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from "class-validator";

export class CreateAssignmentDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsNotEmpty() lessonId!: string;
}

export class UpdateAssignmentDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
}

export class SubmitAssignmentDto {
  @IsString() @IsOptional() fileUrl?: string;
  @IsString() @IsOptional() text?: string;
}

export class GradeAssignmentDto {
  @IsString() @IsNotEmpty() status!: string;
  @IsNumber() @IsOptional() score?: number;
  @IsString() @IsOptional() feedback?: string;
}

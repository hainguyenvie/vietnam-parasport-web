import { IsString, IsNotEmpty, IsNumber, Min, Max } from "class-validator";

export class UpdateCourseProgressDto {
  @IsString() @IsNotEmpty() courseId!: string;
  @IsNumber() @Min(0) @Max(100) progressPct!: number;
}

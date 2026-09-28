import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean } from "class-validator";

export class CreateEventDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() location?: string;
  @IsDateString() @IsOptional() startDate?: string;
  @IsDateString() @IsOptional() endDate?: string;
  @IsBoolean() @IsOptional() isPublished?: boolean;
  @IsString() @IsOptional() thumbnail?: string;
  @IsString() @IsOptional() organizerId?: string;
}

export class UpdateEventDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() location?: string;
  @IsDateString() @IsOptional() startDate?: string;
  @IsDateString() @IsOptional() endDate?: string;
  @IsBoolean() @IsOptional() isPublished?: boolean;
  @IsString() @IsOptional() thumbnail?: string;
  @IsString() @IsOptional() organizerId?: string;
}

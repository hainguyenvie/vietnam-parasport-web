import { IsString, IsOptional } from "class-validator";

export class UpdateEmailTemplateDto {
  @IsString() @IsOptional() subject?: string;
  @IsString() @IsOptional() content?: string;
}

export class PreviewEmailTemplateDto {
  @IsString() content!: string;
  variables?: Record<string, any>;
}

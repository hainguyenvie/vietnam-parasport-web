import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDocumentTopicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;
}

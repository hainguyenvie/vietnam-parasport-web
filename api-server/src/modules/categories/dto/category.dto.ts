import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() parentId?: string;
}

export class UpdateCategoryDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() parentId?: string;
}

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePostDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() content?: string;
  @IsString() @IsOptional() excerpt?: string;
  @IsString() @IsOptional() thumbnail?: string;
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() status?: string;
  @IsArray() @IsOptional() tagIds?: string[];
}

export class UpdatePostDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() content?: string;
  @IsString() @IsOptional() excerpt?: string;
  @IsString() @IsOptional() thumbnail?: string;
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() status?: string;
  @IsArray() @IsOptional() tagIds?: string[];
  @IsDateString() @IsOptional() createdAt?: string;
}

export class PostDateUpdateDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsDateString()
  createdAt!: string;
}

export class BulkUpdatePostDatesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => PostDateUpdateDto)
  updates!: PostDateUpdateDto[];
}

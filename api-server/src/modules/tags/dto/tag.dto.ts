import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateTagDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() slug?: string;
}

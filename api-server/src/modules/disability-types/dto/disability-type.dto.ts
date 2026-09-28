import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateDisabilityTypeDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() desc?: string;
}

export class UpdateDisabilityTypeDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() desc?: string;
}

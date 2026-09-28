import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAdminUserDto {
  @ApiProperty()
  @IsDateString()
  createdAt!: string;
}

export class AdminUserDateUpdateDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsDateString()
  createdAt!: string;
}

export class BulkUpdateAdminUserDatesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => AdminUserDateUpdateDto)
  updates!: AdminUserDateUpdateDto[];
}
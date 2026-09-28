import { IsString, IsOptional, IsNotEmpty, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePartnerDto {
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePartnerDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() name?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

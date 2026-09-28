import { IsString, IsOptional, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSportDto {
  @ApiProperty() @IsString() @IsNotEmpty() nameVi!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiProperty() @IsString() @IsNotEmpty() slug!: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() icon?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() desc?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() descVi?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() descEn?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  detailDescVi?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  detailDescEn?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bannerUrl?: string;
}

export class UpdateSportDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() nameVi?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() nameEn?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() slug?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() icon?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() desc?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() descVi?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() descEn?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  detailDescVi?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  detailDescEn?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bannerUrl?: string;
}

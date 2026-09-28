import { IsString, IsOptional, IsNotEmpty, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCompanionRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() fullName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @IsEmail() email!: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() phone?: string;
  @ApiProperty() @IsString() @IsNotEmpty() type!: string;
  @ApiProperty() @IsString() @IsNotEmpty() message!: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() unit?: string;
}

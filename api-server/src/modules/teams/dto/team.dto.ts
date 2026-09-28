import { IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";

export class CreateTeamDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() sportId?: string;
  @IsString() @IsOptional() organizationId?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() tournamentId?: string;
  @IsArray() @IsOptional() members?: string[];
}

export class UpdateTeamDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsArray() @IsOptional() members?: string[];
}

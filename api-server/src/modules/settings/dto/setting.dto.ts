import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class SetGenericSettingDto {
  @IsString() @IsNotEmpty() key!: string;
  @IsOptional() value?: unknown;
}

import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class ProcessPayoutDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  referenceId?: string;
}

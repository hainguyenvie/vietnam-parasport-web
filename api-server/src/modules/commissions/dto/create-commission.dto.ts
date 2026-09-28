import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsEnum } from "class-validator";

export enum AffiliatePlatform {
  SHOPEE = "SHOPEE",
  TIKTOK = "TIKTOK",
  LAZADA = "LAZADA",
  OTHER = "OTHER",
}

export enum CommissionStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export class CreateCommissionDto {
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @IsString()
  @IsOptional()
  linkId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsEnum(AffiliatePlatform)
  @IsOptional()
  platform?: AffiliatePlatform;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @IsNumber()
  @Min(0)
  commissionAmount: number;

  @IsEnum(CommissionStatus)
  @IsOptional()
  status?: CommissionStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

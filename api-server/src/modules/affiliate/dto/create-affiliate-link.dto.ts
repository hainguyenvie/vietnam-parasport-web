import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from "class-validator";
import { AffiliatePlatform } from "@prisma/client";

export class CreateAffiliateLinkDto {
  @IsEnum(AffiliatePlatform, {
    message: "Nền tảng phải là SHOPEE, TIKTOK, LAZADA hoặc OTHER",
  })
  @IsNotEmpty({ message: "Nền tảng không được để trống" })
  platform: AffiliatePlatform;

  @IsString({ message: "URL gốc phải là chuỗi" })
  @IsNotEmpty({ message: "URL gốc không được để trống" })
  originalUrl: string;

  @IsString({ message: "Tiêu đề phải là chuỗi" })
  @IsNotEmpty({ message: "Tiêu đề không được để trống" })
  title: string;

  @IsString({ message: "Mô tả phải là chuỗi" })
  @IsOptional()
  description?: string;

  @IsString({ message: "Mã affiliate phải là chuỗi" })
  @IsOptional()
  affiliateCode?: string;

  @IsNumber({}, { message: "Tỷ lệ hoa hồng phải là số" })
  @Min(0, { message: "Tỷ lệ hoa hồng phải lớn hơn hoặc bằng 0" })
  @IsOptional()
  commissionRate?: number;

  @IsString({ message: "URL ảnh thu nhỏ phải là chuỗi" })
  @IsOptional()
  thumbnailUrl?: string;

  @IsString({ message: "Mã sản phẩm phải là chuỗi" })
  @IsOptional()
  productId?: string;
}

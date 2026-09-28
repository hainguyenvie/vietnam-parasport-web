import { IsString, IsNotEmpty, MinLength, Matches } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*\d)|(?=.*[A-Z])(?=.*\d))/, {
    message: "Mật khẩu phải chứa ít nhất 2 loại ký tự: chữ thường, chữ hoa, hoặc số",
  })
  newPassword!: string;
}

export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  secret!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;
}

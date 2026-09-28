import { authenticator } from "otplib";

authenticator.options = {
  step: 30,
  window: 1,
  digits: 6,
};

export class Totp {
  static generateSecret(length = 20): string {
    return authenticator.generateSecret(length);
  }

  static generateToken(secret: string): string {
    return authenticator.generate(secret);
  }

  static verify(token: string, secret: string, window = 1): boolean {
    return authenticator.check(token, secret);
  }
}

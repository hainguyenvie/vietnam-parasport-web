import * as crypto from "crypto";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

const getSecret = (): string => {
  const secret = process.env.MEDIA_SIGNATURE_SECRET;
  if (!secret) {
    throw new Error("MEDIA_SIGNATURE_SECRET environment variable is missing!");
  }
  return secret;
};

export function generateSignature(fileName: string, expires: number): string {
  const secret = getSecret();
  const data = `${fileName}:${expires}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function verifySignature(fileName: string, expires: number, signature: string): boolean {
  if (!signature) {
    return false;
  }

  if (Date.now() > expires) {
    return false;
  }

  const secret = getSecret();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${fileName}:${expires}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export function getSignedUrl(fileName: string, expiresInMs = 15 * 60 * 1000): string {
  const expires = Date.now() + expiresInMs;
  const signature = generateSignature(fileName, expires);
  return `/api/v1/media/view?file=${encodeURIComponent(fileName)}&expires=${expires}&signature=${signature}`;
}

export function sanitizeSvg(svgContent: string): string {
  return purify.sanitize(svgContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["animate", "animateMotion", "animateTransform"],
    ADD_ATTR: ["dur", "repeatCount", "fill", "values", "attributeName"],
  });
}

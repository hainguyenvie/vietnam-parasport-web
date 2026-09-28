import { getApiUrl } from "@/utils/api";
import * as crypto from 'crypto';

const getSecret = (): string => {
  const secret = process.env.NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET || process.env.MEDIA_SIGNATURE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET environment variable is missing on web-client!');
    }
    return 'temp-dev-signature-secret-key-1234567890';
  }
  return secret;
};

/**
 * Generates an HMAC-SHA256 signature for a file and expiration timestamp.
 */
export function generateSignature(fileName: string, expires: number): string {
  const secret = getSecret();
  const data = `${fileName}:${expires}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifies if a given HMAC-SHA256 signature is valid and has not expired.
 */
export function verifySignature(fileName: string, expires: number, signature: string): boolean {
  if (!signature) return false;
  if (Date.now() > expires) return false;

  const secret = getSecret();
  const expected = crypto.createHmac('sha256', secret).update(`${fileName}:${expires}`).digest('hex');

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Generates a complete signed URL path for a given filename with a default 15-minute expiry.
 */
export function getSignedUrl(fileName: string): string {
  // If the file is already a full URL or blob URL, return it directly
  if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('blob:') || fileName.startsWith('data:')) {
    return fileName;
  }
  
  // Extract filename only if it contains path
  const name = fileName.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes validity
  const signature = generateSignature(name, expires);
  return getApiUrl(`/media/view?file=${encodeURIComponent(name)}&expires=${expires}&signature=${signature}`);
}

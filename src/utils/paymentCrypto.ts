import crypto from 'node:crypto';

/**
 * Computes and verifies Razorpay HMAC-SHA256 payment or webhook signatures
 * using timing-safe comparison.
 */
export function computeRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
}

export function verifyRazorpayPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, secret } = params;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !secret) {
    return false;
  }
  const expected = computeRazorpayPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    secret
  );
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(razorpaySignature.trim(), 'utf8');
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export function verifyRazorpayWebhookSignature(params: {
  rawBody: string | Buffer;
  signatureHeader: string;
  webhookSecret: string;
}): boolean {
  const { rawBody, signatureHeader, webhookSecret } = params;
  if (!rawBody || !signatureHeader || !webhookSecret) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(signatureHeader.trim(), 'utf8');
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

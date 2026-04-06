/**
 * Google Wallet — Generic Pass (JWT-based "Save to Google Wallet" link)
 * Env vars: GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_CLASS_ID, GOOGLE_SERVICE_ACCOUNT_KEY (base64 JSON)
 *
 * Docs: https://developers.google.com/wallet/generic/web/prerequisites
 */

import { SignJWT, importPKCS8 } from 'jose';

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID ?? '';
const CLASS_ID = process.env.GOOGLE_WALLET_CLASS_ID ?? '';

interface PassParams {
  objectId: string;    // unique per user/prize, e.g. spinresult_<id>
  couponCode?: string;
  prizeName: string;
  prizeDescription?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  backgroundColor?: string;
}

export async function createGoogleWalletUrl(params: PassParams): Promise<{ url: string } | { error: string }> {
  if (!ISSUER_ID || !CLASS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return { error: 'Google Wallet credentials not configured.' };
  }

  let serviceAccount: { client_email: string; private_key: string };
  try {
    const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } catch {
    return { error: 'Invalid GOOGLE_SERVICE_ACCOUNT_KEY.' };
  }

  const classRef = `${ISSUER_ID}.${CLASS_ID}`;
  const objectId = `${ISSUER_ID}.${params.objectId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const genericObject = {
    id: objectId,
    classId: classRef,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: params.backgroundColor ?? '#7C3AED',
    logo: params.logoUrl ? { sourceUri: { uri: params.logoUrl } } : undefined,
    cardTitle: { defaultValue: { language: 'en-US', value: 'SpinPlatform Prize' } },
    subheader: { defaultValue: { language: 'en-US', value: params.prizeName } },
    header: { defaultValue: { language: 'en-US', value: params.couponCode ?? 'Prize Won!' } },
    textModulesData: params.prizeDescription ? [
      { id: 'desc', header: 'Description', body: params.prizeDescription },
    ] : undefined,
    barcode: params.couponCode ? {
      type: 'CODE_128',
      value: params.couponCode,
      alternateText: params.couponCode,
    } : undefined,
    heroImage: params.heroImageUrl ? { sourceUri: { uri: params.heroImageUrl } } : undefined,
  };

  // Sign as JWT
  const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');
  const token = await new SignJWT({
    iss: serviceAccount.client_email,
    aud: 'google',
    origins: [],
    typ: 'savetowallet',
    payload: { genericObjects: [genericObject] },
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .sign(privateKey);

  return { url: `https://pay.google.com/gp/v/save/${token}` };
}

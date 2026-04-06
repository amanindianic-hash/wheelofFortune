/**
 * Apple Wallet — .pkpass bundle generation
 * Uses passkit-generator (npm package)
 *
 * Env vars:
 *   APPLE_PASS_TYPE_ID   — e.g. pass.com.yourcompany.spinplatform
 *   APPLE_TEAM_ID        — your Apple Developer Team ID
 *   APPLE_PASS_CERT      — base64-encoded pass certificate PEM
 *   APPLE_PASS_KEY       — base64-encoded private key PEM
 *   APPLE_WWDR_CERT      — base64-encoded WWDR certificate PEM
 */

interface PassParams {
  serialNumber: string;
  couponCode?: string;
  prizeName: string;
  prizeDescription?: string;
  primaryColor?: string;
  logoText?: string;
}

export async function createAppleWalletPass(params: PassParams): Promise<Buffer | { error: string }> {
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const certB64 = process.env.APPLE_PASS_CERT;
  const keyB64 = process.env.APPLE_PASS_KEY;
  const wwdrB64 = process.env.APPLE_WWDR_CERT;

  if (!passTypeId || !teamId || !certB64 || !keyB64 || !wwdrB64) {
    return { error: 'Apple Wallet credentials not configured.' };
  }

  try {
    const { PKPass } = await import('passkit-generator');

    const signerCert = Buffer.from(certB64, 'base64');
    const signerKey = Buffer.from(keyB64, 'base64');
    const wwdr = Buffer.from(wwdrB64, 'base64');

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber: params.serialNumber,
      teamIdentifier: teamId,
      organizationName: params.logoText ?? 'SpinPlatform',
      description: params.prizeDescription ?? params.prizeName,
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: params.primaryColor ?? 'rgb(124, 58, 237)',
      coupon: {
        primaryFields: [
          { key: 'prize', label: 'Your Prize', value: params.prizeName },
        ],
        secondaryFields: params.couponCode
          ? [{ key: 'code', label: 'Coupon Code', value: params.couponCode }]
          : [],
        auxiliaryFields: [
          { key: 'expires', label: 'Valid', value: 'See terms' },
        ],
        backFields: params.prizeDescription
          ? [{ key: 'desc', label: 'Description', value: params.prizeDescription }]
          : [],
      },
      ...(params.couponCode && {
        barcode: {
          message: params.couponCode,
          format: 'PKBarcodeFormatCode128',
          messageEncoding: 'iso-8859-1',
        },
      }),
    };

    const pass = new PKPass(
      { 'pass.json': Buffer.from(JSON.stringify(passJson)) },
      { signerCert, signerKey, wwdr },
    );

    return pass.getAsBuffer();
  } catch (err: any) {
    console.error('Apple Wallet error:', err);
    return { error: err.message ?? 'Failed to generate pass.' };
  }
}

/**
 * Google Sheets Integration
 *
 * Appends a new row to a Google Sheet when a visitor wins on the wheel.
 * Uses a Google Service Account for authentication (no browser OAuth needed).
 *
 * Config shape (stored in integrations.config jsonb):
 * {
 *   spreadsheet_id:        string,  // The Google Sheet ID from its URL
 *   sheet_name:            string,  // Tab/sheet name, e.g. "Leads"
 *   service_account_email: string,  // Service account email (e.g. name@project.iam.gserviceaccount.com)
 *   private_key:           string,  // PEM private key from the service account JSON key file
 * }
 *
 * Setup: Share the Google Sheet with the service_account_email (Editor role).
 * The sheet should have header row: Timestamp | First Name | Last Name | Email | Prize
 */

import { SignJWT, importPKCS8 } from 'jose';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

async function getGoogleAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const key = await importPKCS8(privateKey, 'RS256');

    const jwt = await new SignJWT({
      iss: serviceAccountEmail,
      scope: SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .sign(key);

    const params = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Google OAuth error:', err);
      return null;
    }

    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error('Google auth fatal error:', error);
    return null;
  }
}

export async function syncToGoogleSheets(
  email: string,
  firstName: string,
  lastName: string,
  prize: any,
  config: any,
) {
  const { spreadsheet_id, sheet_name, service_account_email, private_key } = config;
  if (!spreadsheet_id || !sheet_name || !service_account_email || !private_key) return;

  const accessToken = await getGoogleAccessToken(service_account_email, private_key);
  if (!accessToken) return;

  const timestamp = new Date().toISOString();
  const prizeTitle = prize?.display_title ?? '';
  const range = `${encodeURIComponent(sheet_name)}!A1`;

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[timestamp, firstName, lastName, email, prizeTitle]],
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('Google Sheets append error:', err);
    }
  } catch (error) {
    console.error('Google Sheets fatal error:', error);
  }
}

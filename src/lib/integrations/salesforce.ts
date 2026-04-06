/**
 * Salesforce Integration
 *
 * Syncs a lead to Salesforce CRM using the Username-Password OAuth2 flow.
 *
 * Config shape (stored in integrations.config jsonb):
 * {
 *   instance_url:    string,  // e.g. "https://yourorg.my.salesforce.com"
 *   client_id:       string,  // Connected App Consumer Key
 *   client_secret:   string,  // Connected App Consumer Secret
 *   username:        string,  // Salesforce user login
 *   password:        string,  // Salesforce user password
 *   security_token:  string,  // Salesforce user security token (appended to password)
 * }
 *
 * Salesforce Connected App must have:
 *   OAuth scopes: api, refresh_token
 */

async function getSalesforceAccessToken(config: any): Promise<{ access_token: string; instance_url: string } | null> {
  const { instance_url, client_id, client_secret, username, password, security_token } = config;

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id,
    client_secret,
    username,
    password: `${password}${security_token}`,
  });

  try {
    const res = await fetch(`${instance_url}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Salesforce OAuth error:', err);
      return null;
    }

    const data = await res.json();
    return { access_token: data.access_token, instance_url: data.instance_url };
  } catch (error) {
    console.error('Salesforce auth fatal error:', error);
    return null;
  }
}

export async function syncToSalesforce(
  email: string,
  firstName: string,
  lastName: string,
  config: any,
) {
  const { instance_url, client_id, client_secret, username, password, security_token } = config;
  if (!instance_url || !client_id || !client_secret || !username || !password) return;

  const auth = await getSalesforceAccessToken(config);
  if (!auth) return;

  try {
    const res = await fetch(
      `${auth.instance_url}/services/data/v58.0/sobjects/Lead`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FirstName: firstName,
          LastName: lastName || email.split('@')[0],
          Email: email,
          Company: 'WheelFortune Lead',
          LeadSource: 'Web',
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('Salesforce Lead create error:', err);
    }
  } catch (error) {
    console.error('Salesforce fatal error:', error);
  }
}

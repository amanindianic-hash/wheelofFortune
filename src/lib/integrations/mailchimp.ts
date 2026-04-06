export async function syncToMailchimp(email: string, firstName: string, lastName: string, config: any) {
  const { api_key, list_id } = config;
  if (!api_key || !list_id) return;

  const datacenter = api_key.split('-')[1];
  const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${list_id}/members`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Mailchimp sync error:', err);
    }
  } catch (error) {
    console.error('Mailchimp fatal error:', error);
  }
}

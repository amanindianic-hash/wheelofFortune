export async function syncToKlaviyo(email: string, firstName: string, lastName: string, config: any) {
  const { api_key, list_id } = config;
  if (!api_key || !list_id) return;

  const url = `https://a.klaviyo.com/api/v2/list/${list_id}/subscribe`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profiles: [{
          email,
          first_name: firstName,
          last_name: lastName,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Klaviyo sync error:', err);
    }
  } catch (error) {
    console.error('Klaviyo fatal error:', error);
  }
}

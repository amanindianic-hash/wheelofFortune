/**
 * HubSpot Integration
 *
 * Syncs a lead (contact) to HubSpot CRM when a visitor wins on the wheel.
 *
 * Config shape (stored in integrations.config jsonb):
 * {
 *   access_token: string,   // HubSpot Private App access token
 *   list_id?:     string,   // Optional: HubSpot contact list ID to add the contact to
 * }
 *
 * Required HubSpot Private App scopes:
 *   crm.objects.contacts.write, crm.lists.write (if using list_id)
 */

export async function syncToHubSpot(
  email: string,
  firstName: string,
  lastName: string,
  config: any,
) {
  const { access_token, list_id } = config;
  if (!access_token) return;

  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  };

  // 1. Create or update contact (upsert by email)
  try {
    const contactRes = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          properties: {
            email,
            firstname: firstName,
            lastname: lastName,
          },
        }),
      },
    );

    let contactId: string | null = null;

    if (contactRes.ok) {
      const data = await contactRes.json();
      contactId = data.id;
    } else if (contactRes.status === 409) {
      // Contact already exists — extract id from error body
      const err = await contactRes.json();
      const match = err?.message?.match(/existing ID: (\d+)/);
      if (match) contactId = match[1];
    } else {
      const err = await contactRes.json();
      console.error('HubSpot contact create error:', err);
      return;
    }

    // 2. Optionally add to a contact list
    if (list_id && contactId) {
      const listRes = await fetch(
        `https://api.hubapi.com/contacts/v1/lists/${list_id}/add`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ vids: [parseInt(contactId, 10)] }),
        },
      );

      if (!listRes.ok) {
        const err = await listRes.json();
        console.error('HubSpot list add error:', err);
      }
    }
  } catch (error) {
    console.error('HubSpot fatal error:', error);
  }
}

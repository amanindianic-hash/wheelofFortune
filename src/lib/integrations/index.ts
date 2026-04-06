import { sql } from '@/lib/db';
import { syncToMailchimp } from './mailchimp';
import { syncToKlaviyo } from './klaviyo';
import { syncToWebhook } from './webhooks';
import { createShopifyDiscountCode } from './shopify';
import { syncToHubSpot } from './hubspot';
import { syncToSalesforce } from './salesforce';
import { syncToGoogleSheets } from './google-sheets';
import { syncToZapier } from './zapier';

export async function processLeadSync(clientId: string, email: string, leadData: Record<string, any>, prize: any, sessionId?: string) {
  try {
    // 1. Fetch all active integrations for the client
    const integrationsRows = await sql`
      SELECT type, config
      FROM integrations
      WHERE client_id = ${clientId}
        AND is_active = TRUE
        AND deleted_at IS NULL
    `;
    const integrations = integrationsRows as any[];

    if (integrations.length === 0) return;

    const firstName = leadData.name?.split(' ')[0] || '';
    const lastName = leadData.name?.split(' ').slice(1).join(' ') || '';

    // 2. Process each integration
    const syncTasks = integrations.map(async (integration) => {
      switch (integration.type) {
        case 'mailchimp':
          return syncToMailchimp(email, firstName, lastName, integration.config);
        case 'klaviyo':
          return syncToKlaviyo(email, firstName, lastName, integration.config);
        case 'webhook':
          return syncToWebhook(email, firstName, lastName, prize, integration.config);
        case 'shopify':
          if (prize) {
            return createShopifyDiscountCode(integration.config, prize.display_title);
          }
          return;
        case 'hubspot':
          return syncToHubSpot(email, firstName, lastName, integration.config);
        case 'salesforce':
          return syncToSalesforce(email, firstName, lastName, integration.config);
        case 'google_sheets':
          return syncToGoogleSheets(email, firstName, lastName, prize, integration.config);
        case 'zapier':
          return syncToZapier(email, firstName, lastName, prize, integration.config);
        default:
          console.warn(`Unsupported integration type: ${integration.type}`);
      }
    });

    // 3. Track and record sync results (Non-blocking)
    Promise.allSettled(syncTasks).then(async (results) => {
      const statuses = results.map((res, i) => ({
        type: integrations[i].type,
        status: res.status,
        error: res.status === 'rejected' ? String(res.reason) : null
      }));

      // Store in custom_fields metadata as a reliability backup
      if (sessionId) {
        console.log(`[LEAD_SYNC] Recording results for session ${sessionId}`);
        await sql`
          UPDATE spin_sessions
          SET lead_custom_fields = lead_custom_fields || ${JSON.stringify({ _sync_results: statuses })}::jsonb
          WHERE id = ${sessionId}
        `;
      }

      statuses.forEach(s => {
        if (s.status === 'rejected') {
          console.error(`Sync task ${s.type} failed:`, s.error);
        }
      });
    });

  } catch (error) {
    console.error('Lead sync processing error:', error);
  }
}

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';

/**
 * POST /api/account/gdpr-delete
 * Invokes the database function to anonymize all PII for a given email.
 * Required for GDPR compliance (Right to Erasure).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  // Only owner or admin can initiate data erasure
  if (!['owner', 'admin'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions for data erasure.', 403);
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return errorResponse('VALIDATION_ERROR', 'A valid email address is required for erasure.', 400);
    }

    // Call stored procedure: gdpr_anonymise_session_data(p_lead_email VARCHAR)
    // We avoid destructuring here due to Neon worker issue
    const result = await sql`SELECT gdpr_anonymise_session_data(${email}) AS affected_count`;
    const affectedCount = (result as any)[0].affected_count;

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'user_data_deleted',
      resourceType: 'end_user',
      resourceId: undefined, // email is the identifier here
      changes: { email, affected_count: affectedCount }
    });

    return okResponse({
      success: true,
      message: `Anonymisation complete. ${affectedCount} session(s) scrubbed.`,
      affected_count: affectedCount
    });
  } catch (err) {
    console.error('GDPR erasure error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to perform data erasure.', 500);
  }
}

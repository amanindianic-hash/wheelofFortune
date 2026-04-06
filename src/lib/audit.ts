import { NextRequest } from 'next/server';
import { sql } from './db';
import { AuditAction } from './types';

interface AuditParams {
  req: NextRequest;
  userId?: string;
  clientId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
}

/**
 * Logs an administrative action to the audit_logs table for SOP compliance.
 * Immutable and required for all dashboard CRUD operations.
 */
export async function logAuditAction({
  req,
  userId,
  clientId,
  action,
  resourceType,
  resourceId,
  changes = {}
}: AuditParams) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || (req as any).ip || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await sql`
      INSERT INTO audit_logs (
        client_id, user_id, action, resource_type, resource_id,
        changes, ip_address, user_agent
      ) VALUES (
        ${clientId}, ${userId || null}, ${action}, ${resourceType}, ${resourceId || null},
        ${JSON.stringify(changes)}, ${ip}, ${userAgent}
      )
    `;
  } catch (err) {
    // Audit logging should not block the main operation, but should be logged if it fails
    console.error('Audit logging failed:', err);
  }
}

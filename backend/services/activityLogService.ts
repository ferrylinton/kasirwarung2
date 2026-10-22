import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'REVOKE_TOKEN'
  | 'ACTIVATE'
  | 'DEACTIVATE';

export type ActivityEntity =
  | 'PRODUK'
  | 'KATEGORI'
  | 'PENGGUNA'
  | 'TOKO'
  | 'REVOKE_TOKEN';

export interface ActivityLogDocument {
  _id?: ObjectId;
  tenantId: ObjectId | null;
  tenantName: string;
  userId: ObjectId | null;
  userName: string;
  userEmail: string;
  userRole: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string | null;
  entityName: string;
  details: string;
  previousData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress: string;
  device: string;
  createdAt: string;
}

export async function logActivity(params: {
  tenantId?: string | ObjectId | null;
  tenantName?: string | null;
  userId?: string | ObjectId | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string | ObjectId | null;
  entityName: string;
  details: string;
  previousData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress?: string;
  device?: string;
}): Promise<void> {
  try {
    const col = getCollection('activity_logs');
    const tenantsCol = getCollection('tenants');

    let resolvedTenantName = params.tenantName;
    const tId = safeObjectId(params.tenantId);
    if (!resolvedTenantName && tId) {
      const t = await tenantsCol.findOne({ _id: tId });
      if (t) resolvedTenantName = t.name;
    }

    const doc: ActivityLogDocument = {
      _id: new ObjectId(),
      tenantId: tId,
      tenantName:
        resolvedTenantName ||
        (params.userRole === 'ADMIN' ? 'Platform Administrator' : 'Toko Utama'),
      userId: safeObjectId(params.userId),
      userName: params.userName || 'User',
      userEmail: params.userEmail || '-',
      userRole: params.userRole || 'SHOP_CASHIER',
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ? String(params.entityId) : null,
      entityName: params.entityName,
      details: params.details,
      previousData: params.previousData || null,
      newData: params.newData || null,
      ipAddress: params.ipAddress || '127.0.0.1',
      device: params.device || 'Browser Client',
      createdAt: new Date().toISOString(),
    };

    await col.insertOne(doc as any);
  } catch (err) {
    console.warn('[ActivityLog] Failed to record log:', err);
  }
}

export async function recordActivity(
  req: AuthenticatedRequest,
  params: {
    action: ActivityAction;
    entity: ActivityEntity;
    entityId?: string | ObjectId | null;
    entityName: string;
    details: string;
    tenantId?: string | ObjectId | null;
    tenantName?: string | null;
    previousData?: Record<string, any> | null;
    newData?: Record<string, any> | null;
  }
): Promise<void> {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
  const device = (req.headers['user-agent'] as string) || 'Browser Client';
  const user = req.user;

  await logActivity({
    tenantId: params.tenantId || user?.tenantId || null,
    tenantName: params.tenantName || user?.tenantName || null,
    userId: user?.userId || null,
    userName: user?.name || 'User',
    userEmail: user?.email || '-',
    userRole: user?.role || 'SHOP_CASHIER',
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    entityName: params.entityName,
    details: params.details,
    previousData: params.previousData,
    newData: params.newData,
    ipAddress,
    device,
  });
}

import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from './audit-log.entity';
export interface AuditLogInput {
    tenantId?: string;
    actorId?: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    metadata?: Record<string, unknown>;
}
export declare class AuditLogsService {
    private readonly auditRepository;
    constructor(auditRepository: Repository<AuditLog>);
    log(input: AuditLogInput): Promise<AuditLog>;
    findForTenant(tenantId: string, options?: {
        limit?: number;
        resourceType?: string;
    }): Promise<AuditLog[]>;
    findAllPlatform(limit?: number): Promise<AuditLog[]>;
}

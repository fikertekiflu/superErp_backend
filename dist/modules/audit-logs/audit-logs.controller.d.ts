import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findPlatform(limit?: string): Promise<import("./audit-log.entity").AuditLog[]>;
    findAll(req: any, limit?: string, resourceType?: string): Promise<import("./audit-log.entity").AuditLog[]>;
}

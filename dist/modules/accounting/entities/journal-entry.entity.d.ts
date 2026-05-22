import { Tenant } from '../../tenants/tenant.entity';
import { JournalLine } from './journal-line.entity';
export declare enum JournalEntryStatus {
    DRAFT = "DRAFT",
    POSTED = "POSTED"
}
export declare class JournalEntry {
    id: string;
    tenantId: string;
    tenant: Tenant;
    referenceNumber: string;
    date: Date;
    description: string;
    status: JournalEntryStatus;
    lines: JournalLine[];
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
}

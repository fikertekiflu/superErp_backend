import { Tenant } from '../../tenants/tenant.entity';
export declare enum AccountType {
    ASSET = "ASSET",
    LIABILITY = "LIABILITY",
    EQUITY = "EQUITY",
    REVENUE = "REVENUE",
    EXPENSE = "EXPENSE"
}
export declare class Account {
    id: string;
    tenantId: string;
    tenant: Tenant;
    code: string;
    name: string;
    type: AccountType;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

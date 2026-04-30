import { Tenant } from '../tenants/tenant.entity';
import { Plan } from './plan.entity';
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    TRIALING = "trialing",
    PAST_DUE = "past_due",
    CANCELED = "canceled",
    INCOMPLETE = "incomplete"
}
export declare class Subscription {
    id: string;
    tenant: Tenant;
    tenantId: string;
    plan: Plan;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

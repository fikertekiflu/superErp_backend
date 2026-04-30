import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';
import { Tenant } from '../tenants/tenant.entity';
export declare class SubscriptionsService {
    private planRepository;
    private subscriptionRepository;
    private tenantRepository;
    constructor(planRepository: Repository<Plan>, subscriptionRepository: Repository<Subscription>, tenantRepository: Repository<Tenant>);
    onModuleInit(): Promise<void>;
    private seedDefaultPlans;
    findAllPlans(): Promise<Plan[]>;
    findPlanById(id: string): Promise<Plan>;
    findTenantSubscription(tenantId: string): Promise<Subscription>;
    private createDefaultSubscription;
    upgradePlan(tenantId: string, planId: string): Promise<Subscription>;
    checkLimit(tenantId: string, limitKey: keyof Plan['limits'], currentCount: number): Promise<boolean>;
    findAllSubscriptions(): Promise<Subscription[]>;
    updatePlan(id: string, data: any): Promise<Plan>;
    createPlan(planData: Partial<Plan>): Promise<Plan>;
}

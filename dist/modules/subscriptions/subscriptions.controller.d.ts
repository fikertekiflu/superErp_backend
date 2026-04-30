import { SubscriptionsService } from './subscriptions.service';
import { ChapaService } from './chapa.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    private readonly chapaService;
    constructor(subscriptionsService: SubscriptionsService, chapaService: ChapaService);
    getPlans(): Promise<import("./plan.entity").Plan[]>;
    getMySubscription(req: any): Promise<import("./subscription.entity").Subscription>;
    upgrade(planId: string, req: any): Promise<import("./subscription.entity").Subscription>;
    findAllSubscriptions(): Promise<import("./subscription.entity").Subscription[]>;
    findAllPlans(): Promise<import("./plan.entity").Plan[]>;
    updatePlan(id: string, data: any): Promise<import("./plan.entity").Plan>;
    checkout(planId: string, req: any): Promise<any>;
    verify(tx_ref: string, req: any): Promise<{
        status: string;
        message: string;
    }>;
    createPlan(planData: any): Promise<import("./plan.entity").Plan>;
}

import { Subscription } from './subscription.entity';
export declare class Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    modules: string[];
    features: string[];
    limits: {
        maxUsers: number;
        maxEntities: number;
        maxWorkflows: number;
        maxStorageGB?: number;
    };
    isActive: boolean;
    subscriptions: Subscription[];
    createdAt: Date;
    updatedAt: Date;
}

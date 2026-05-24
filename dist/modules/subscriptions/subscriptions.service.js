"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_entity_1 = require("./plan.entity");
const subscription_entity_1 = require("./subscription.entity");
const tenant_entity_1 = require("../tenants/tenant.entity");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    planRepository;
    subscriptionRepository;
    tenantRepository;
    logger = new common_1.Logger(SubscriptionsService_1.name);
    constructor(planRepository, subscriptionRepository, tenantRepository) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
    }
    async onModuleInit() {
        await this.seedDefaultPlans();
    }
    async seedDefaultPlans() {
        const defaultPlans = [
            {
                name: 'Starter',
                price: 999,
                interval: 'month',
                modules: ['invoicing', 'hrm_basic'],
                limits: { maxUsers: 5, maxEntities: 10, maxWorkflows: 3 },
                features: ['Basic CRM', 'Invoicing', 'Basic HRM', 'Email Support'],
                isActive: true,
            },
            {
                name: 'Professional',
                price: 2499,
                interval: 'month',
                modules: ['invoicing', 'hrm_advanced', 'attendance'],
                limits: { maxUsers: 20, maxEntities: 50, maxWorkflows: 15 },
                features: ['Advanced CRM', 'Advanced HRM', 'Attendance Tracking', 'Custom Workflows', 'Priority Support'],
                isActive: true,
            },
            {
                name: 'Enterprise',
                price: 5999,
                interval: 'month',
                modules: ['invoicing', 'hrm_advanced', 'attendance', 'accounting'],
                limits: { maxUsers: 100, maxEntities: 500, maxWorkflows: 100 },
                features: ['Full Suite', 'Accounting Module', 'Audit Logs', '24/7 Dedicated Support'],
                isActive: true,
            },
        ];
        await this.planRepository.createQueryBuilder()
            .update(plan_entity_1.Plan)
            .set({ currency: 'ETB' })
            .where('currency != :etb', { etb: 'ETB' })
            .execute();
        for (const planData of defaultPlans) {
            const existingPlan = await this.planRepository.createQueryBuilder('plan')
                .where('plan.name ILIKE :name', { name: `%${planData.name.split(' ')[0]}%` })
                .getOne();
            if (existingPlan) {
                await this.planRepository.update(existingPlan.id, {
                    price: planData.price,
                    currency: 'ETB',
                    limits: planData.limits,
                    features: planData.features
                });
            }
            else {
                await this.planRepository.save(this.planRepository.create(planData));
            }
        }
        this.logger.log('Synced subscription plans to ETB');
    }
    async findAllPlans() {
        return this.planRepository.find({ where: { isActive: true } });
    }
    async findPlanById(id) {
        const plan = await this.planRepository.findOne({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
    async findTenantSubscription(tenantId) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { tenantId },
            relations: ['plan'],
        });
        if (!subscription) {
            return this.createDefaultSubscription(tenantId);
        }
        return subscription;
    }
    async createDefaultSubscription(tenantId) {
        let freePlan = await this.planRepository.findOne({ where: { price: 0, isActive: true } });
        if (!freePlan) {
            freePlan = this.planRepository.create({
                name: 'Free Trial',
                description: 'Starter plan for small businesses',
                price: 0,
                limits: {
                    maxUsers: 3,
                    maxEntities: 5,
                    maxWorkflows: 2,
                },
                features: ['Basic Entities', 'Email Support'],
            });
            freePlan = await this.planRepository.save(freePlan);
        }
        const subscription = this.subscriptionRepository.create({
            tenantId,
            planId: freePlan.id,
            status: subscription_entity_1.SubscriptionStatus.TRIALING,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
        return this.subscriptionRepository.save(subscription);
    }
    async upgradePlan(tenantId, planId) {
        const plan = await this.planRepository.findOne({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        let subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });
        if (subscription) {
            await this.subscriptionRepository.update(subscription.id, {
                planId: plan.id,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            console.log(`Plan upgraded for tenant ${tenantId} to ${plan.name}`);
        }
        else {
            subscription = this.subscriptionRepository.create({
                tenantId,
                planId: plan.id,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            await this.subscriptionRepository.save(subscription);
            this.logger.log(`New subscription for tenant ${tenantId} on plan ${plan.name}`);
        }
        return this.findTenantSubscription(tenantId);
    }
    async checkLimit(tenantId, limitKey, currentCount) {
        const subscription = await this.findTenantSubscription(tenantId);
        const limit = subscription.plan.limits[limitKey];
        if (limit && currentCount >= limit) {
            throw new common_1.BadRequestException(`Limit reached for ${limitKey}. Please upgrade your plan.`);
        }
        return true;
    }
    async findAllSubscriptions() {
        return this.subscriptionRepository.find({
            relations: ['plan', 'tenant'],
            order: { createdAt: 'DESC' },
        });
    }
    async updatePlan(id, data) {
        await this.planRepository.update(id, data);
        return this.planRepository.findOne({ where: { id } });
    }
    async createPlan(planData) {
        const plan = this.planRepository.create(planData);
        return this.planRepository.save(plan);
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map
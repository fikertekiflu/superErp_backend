import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { Subscription, SubscriptionStatus } from './subscription.entity';
import { Tenant } from '../tenants/tenant.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  private async seedDefaultPlans() {
    const defaultPlans = [
      {
        name: 'Starter',
        price: 999,
        interval: 'month' as const,
        modules: ['invoicing', 'hrm_basic'],
        limits: { maxUsers: 5, maxEntities: 10, maxWorkflows: 3 },
        features: ['Basic CRM', 'Invoicing', 'Basic HRM', 'Email Support'],
        isActive: true,
      },
      {
        name: 'Professional',
        price: 2499,
        interval: 'month' as const,
        modules: ['invoicing', 'hrm_advanced', 'attendance'],
        limits: { maxUsers: 20, maxEntities: 50, maxWorkflows: 15 },
        features: ['Advanced CRM', 'Advanced HRM', 'Attendance Tracking', 'Custom Workflows', 'Priority Support'],
        isActive: true,
      },
      {
        name: 'Enterprise',
        price: 5999,
        interval: 'month' as const,
        modules: ['invoicing', 'hrm_advanced', 'attendance', 'accounting'],
        limits: { maxUsers: 100, maxEntities: 500, maxWorkflows: 100 },
        features: ['Full Suite', 'Accounting Module', 'Audit Logs', '24/7 Dedicated Support'],
        isActive: true,
      },
    ];

    // Global cleanup: Ensure all existing plans are ETB
    await this.planRepository.createQueryBuilder()
      .update(Plan)
      .set({ currency: 'ETB' })
      .where('currency != :etb', { etb: 'ETB' })
      .execute();

    for (const planData of defaultPlans) {
      // Find plan by name (fuzzy match)
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
      } else {
        await this.planRepository.save(this.planRepository.create(planData));
      }
    }
    this.logger.log('Synced subscription plans to ETB');
  }

  async findAllPlans() {
    return this.planRepository.find({ where: { isActive: true } });
  }

  async findPlanById(id: string) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async findTenantSubscription(tenantId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId },
      relations: ['plan'],
    });

    if (!subscription) {
      // If no subscription exists, create a trial/free one
      return this.createDefaultSubscription(tenantId);
    }

    return subscription;
  }

  private async createDefaultSubscription(tenantId: string) {
    // Find free plan
    let freePlan = await this.planRepository.findOne({ where: { price: 0, isActive: true } });
    
    if (!freePlan) {
      // Create free plan if doesn't exist
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
      status: SubscriptionStatus.TRIALING,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    });

    return this.subscriptionRepository.save(subscription);
  }

  async upgradePlan(tenantId: string, planId: string) {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    let subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });
    
    if (subscription) {
      // Force update the existing subscription
      await this.subscriptionRepository.update(subscription.id, {
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      console.log(`Plan upgraded for tenant ${tenantId} to ${plan.name}`);
    } else {
      // Create a brand new subscription if one doesn't exist
      subscription = this.subscriptionRepository.create({
        tenantId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await this.subscriptionRepository.save(subscription);
      this.logger.log(`New subscription for tenant ${tenantId} on plan ${plan.name}`);
    }
    return this.findTenantSubscription(tenantId);
  }

  // Helper to check if a tenant can perform an action based on their limits
  async checkLimit(tenantId: string, limitKey: keyof Plan['limits'], currentCount: number) {
    const subscription = await this.findTenantSubscription(tenantId);
    const limit = subscription.plan.limits[limitKey];
    
    if (limit && currentCount >= limit) {
      throw new BadRequestException(`Limit reached for ${limitKey}. Please upgrade your plan.`);
    }
    return true;
  }

  // Admin methods
  async findAllSubscriptions() {
    return this.subscriptionRepository.find({
      relations: ['plan', 'tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async updatePlan(id: string, data: { price?: number; limits?: any; isActive?: boolean; modules?: string[] }) {
    await this.planRepository.update(id, data);
    return this.planRepository.findOne({ where: { id } });
  }

  async createPlan(planData: Partial<Plan>) {
    const plan = this.planRepository.create(planData);
    return this.planRepository.save(plan);
  }
}

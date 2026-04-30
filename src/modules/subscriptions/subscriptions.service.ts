import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { Subscription, SubscriptionStatus } from './subscription.entity';
import { Tenant } from '../tenants/tenant.entity';

@Injectable()
export class SubscriptionsService {
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
        name: 'Starter (Free)',
        description: 'Perfect for exploring SuperERP capabilities.',
        price: 0,
        currency: 'ETB',
        features: ['Up to 3 Users', 'Up to 5 Entities', 'Basic Workflows'],
        limits: { maxUsers: 3, maxEntities: 5, maxWorkflows: 2 },
        isActive: true,
      },
      {
        name: 'Professional',
        description: 'Scale your business with advanced logic and more capacity.',
        price: 2500,
        currency: 'ETB',
        features: ['Up to 15 Users', 'Unlimited Entities', 'Advanced Workflows', 'Priority Support'],
        limits: { maxUsers: 15, maxEntities: 999, maxWorkflows: 20 },
        isActive: true,
      },
      {
        name: 'Enterprise',
        description: 'Unlimited power for large scale organizations.',
        price: 10000,
        currency: 'ETB',
        features: ['Unlimited everything', 'Custom Entities', 'Dedicated Account Manager', 'SLA Guarantee'],
        limits: { maxUsers: 999, maxEntities: 999, maxWorkflows: 999 },
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
    console.log('Successfully synced/updated subscription plans to ETB.');
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
      console.log(`New subscription created for tenant ${tenantId} on plan ${plan.name}`);
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

  async updatePlan(id: string, data: any) {
    await this.planRepository.update(id, data);
    return this.findPlanById(id);
  }

  async createPlan(planData: Partial<Plan>) {
    const plan = this.planRepository.create(planData);
    return this.planRepository.save(plan);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';
import { Tenant } from '../tenants/tenant.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { ChapaService } from './chapa.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, Subscription, Tenant])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, ChapaService],
  exports: [SubscriptionsService, ChapaService],
})
export class SubscriptionsModule {}

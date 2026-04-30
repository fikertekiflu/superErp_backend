import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { Tenant } from './tenant.entity';
import { EntitiesService } from '../entities/entities.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { Entity } from '../entities/entity.entity';
import { EntityData } from '../entities/entity-data.entity';
import { Workflow } from '../workflows/workflow.entity';
import { WorkflowStep } from '../workflows/workflow-step.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Entity,
      EntityData,
      Workflow,
      WorkflowStep,
    ]),
    SubscriptionsModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, EntitiesService, WorkflowsService],
  exports: [TenantsService],
})
export class TenantsModule {}

import { Module, forwardRef } from '@nestjs/common';
import { EntitiesModule } from '../entities/entities.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './workflows.controller';
import { WorkflowExecutionsController } from './workflow-executions.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowExecutionService } from './workflow-execution.service';
import { Workflow } from './workflow.entity';
import { WorkflowState } from './workflow-state.entity';
import { WorkflowTransition } from './workflow-transition.entity';
import { WorkflowEvent } from './workflow-event.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowStep } from './workflow-step.entity';
import { ConditionalLogicService } from './conditional-logic.service';
import { Entity as DynamicEntity } from '../entities/entity.entity';
import { Task } from '../tasks/task.entity';
import { Notification } from '../notifications/notification.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Employee } from '../hrm/entities/employee.entity';
import { Department } from '../hrm/entities/department.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Role } from '../roles/role.entity';
import { EntityData } from '../entities/entity-data.entity';
import { WorkflowAutomationService } from './workflow-automation.service';
import { WorkflowTriggerService } from './workflow-trigger.service';
import { WorkflowAnalyticsService } from './workflow-analytics.service';
import { WorkflowDelegationsService } from './workflow-delegations.service';
import { WorkflowApprovalLimitsService } from './workflow-approval-limits.service';
import { WorkflowDelegation } from './workflow-delegation.entity';
import { WorkflowDelegationsController } from './workflow-delegations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowStep,
      WorkflowExecution,
      WorkflowEvent,
      WorkflowState,
      WorkflowTransition,
      WorkflowDelegation,
      DynamicEntity,
      EntityData,
      Task,
      Notification,
      User,
      Tenant,
      Employee,
      Department,
      Role,
    ]),
    SubscriptionsModule,
    forwardRef(() => EntitiesModule),
  ],
  controllers: [
    WorkflowsController,
    WorkflowExecutionsController,
    WorkflowDelegationsController,
  ],
  providers: [
    WorkflowsService,
    WorkflowExecutionService,
    ConditionalLogicService,
    WorkflowAutomationService,
    WorkflowTriggerService,
    WorkflowAnalyticsService,
    WorkflowDelegationsService,
    WorkflowApprovalLimitsService,
  ],
  exports: [
    WorkflowsService,
    WorkflowExecutionService,
    WorkflowTriggerService,
    WorkflowDelegationsService,
    WorkflowApprovalLimitsService,
  ],
})
export class WorkflowsModule {}

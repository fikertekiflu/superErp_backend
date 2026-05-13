import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, WorkflowStep, WorkflowExecution, WorkflowEvent, WorkflowState, WorkflowTransition, DynamicEntity, Task, Notification, User, Tenant, Employee, Department]),
    SubscriptionsModule,
  ],
  controllers: [WorkflowsController, WorkflowExecutionsController],
  providers: [
    WorkflowsService,
    WorkflowExecutionService,
    ConditionalLogicService,
  ],
  exports: [WorkflowsService, WorkflowExecutionService],
})
export class WorkflowsModule {}

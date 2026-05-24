import { Module, forwardRef } from '@nestjs/common';
import { WorkflowsModule } from '../workflows/workflows.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { WorkflowExecution } from '../workflows/workflow-execution.entity';
import { WorkflowStep } from '../workflows/workflow-step.entity';
import { Workflow } from '../workflows/workflow.entity';
import { Notification } from '../notifications/notification.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { Entity } from '../entities/entity.entity';
import { EntityData } from '../entities/entity-data.entity';

@Module({
  imports: [
    forwardRef(() => WorkflowsModule),
    TypeOrmModule.forFeature([
      Task,
      WorkflowExecution,
      WorkflowStep,
      Workflow,
      Notification,
      User,
      Role,
      Entity,
      EntityData,
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

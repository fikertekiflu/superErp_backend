import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, WorkflowExecution, WorkflowStep, Workflow, Notification, User, Role]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

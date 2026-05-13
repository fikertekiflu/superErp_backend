import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { WorkflowExecution } from '../workflows/workflow-execution.entity';
import { WorkflowStep } from '../workflows/workflow-step.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskType {
  TASK = 'task',
  APPROVAL = 'approval',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: TaskType.TASK })
  type: string;

  @Column({ default: TaskStatus.PENDING })
  status: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: string;

  // Role-based assignment with claim system
  @Column({ nullable: true })
  assignedToRoleId: string; // Role this task is assigned to

  @Column({ type: 'simple-array', nullable: true })
  visibleToRoleIds: string[]; // Roles that can see this task

  @ManyToOne(() => User)
  @JoinColumn({ name: 'claimedByUserId' })
  claimedBy: User;

  @Column({ nullable: true })
  claimedByUserId: string; // Who actually claimed/owns this task

  @Column({ type: 'timestamp', nullable: true })
  claimedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => WorkflowExecution)
  @JoinColumn({ name: 'executionId' })
  execution: WorkflowExecution;

  @Column({ nullable: true })
  executionId: string;

  @ManyToOne(() => WorkflowStep)
  @JoinColumn({ name: 'stepId' })
  step: WorkflowStep;

  @Column({ nullable: true })
  stepId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    entityName?: string;
    entityId?: string;
    actionRequired?: string;
    priority?: 'low' | 'medium' | 'high';
  };

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  result: {
    approved?: boolean;
    notes?: string;
    data?: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

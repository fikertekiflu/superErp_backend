import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

// State machine states for workflows
export enum WorkflowState {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVAL = 'approval',
  IT_SETUP = 'it_setup',
  FINANCE_APPROVAL = 'finance_approval',
  HR_FINALIZATION = 'hr_finalization',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ nullable: true })
  workflowId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggeredById' })
  triggeredBy: User;

  @Column({ nullable: true })
  triggeredById: string;

  @Column({ default: ExecutionStatus.PENDING })
  status: string;

  @Column({ type: 'varchar', default: WorkflowState.PENDING })
  currentState: string;

  @Column({ type: 'int', default: 0 })
  currentStepOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  stateHistory: {
    fromState: string;
    toState: string;
    timestamp: string;
    actorId?: string;
    actorName?: string;
    action?: string;
    notes?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  context: {
    entityId?: string;
    entityType?: string;
    entityData?: Record<string, any>;
    triggerType?: string;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  stepResults: any[];

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

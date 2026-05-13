import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowExecution } from './workflow-execution.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';

export enum EventType {
  TRIGGERED = 'triggered',
  STATE_CHANGED = 'state_changed',
  TASK_CREATED = 'task_created',
  TASK_CLAIMED = 'task_claimed',
  TASK_COMPLETED = 'task_completed',
  APPROVAL_REQUESTED = 'approval_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  STEP_EXECUTED = 'step_executed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated',
}

@Entity('workflow_events')
export class WorkflowEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowExecution)
  @JoinColumn({ name: 'executionId' })
  execution: WorkflowExecution;

  @Column({ nullable: true })
  executionId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ nullable: true })
  actorId: string;

  @Column({ type: 'varchar' })
  eventType: EventType;

  @Column({ type: 'varchar', nullable: true })
  fromState: string;

  @Column({ type: 'varchar', nullable: true })
  toState: string;

  @Column({ type: 'varchar', nullable: true })
  stepId: string;

  @Column({ type: 'varchar', nullable: true })
  stepName: string;

  @Column({ type: 'varchar', nullable: true })
  taskId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    // For approvals
    approved?: boolean;
    rejectionReason?: string;
    
    // For tasks
    assignedToRoleId?: string;
    assignedToUserId?: string;
    
    // For state changes
    triggerReason?: string;
    
    // For escalations
    overdueHours?: number;
    escalatedTo?: string;
    
    // Any additional context
    [key: string]: any;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}

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
import { Workflow } from './workflow.entity';

export enum StepType {
  TASK = 'task',
  APPROVAL = 'approval',
  NOTIFICATION = 'notification',
  CONDITION = 'condition',
  AUTOMATION = 'automation',
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ default: StepType.TASK })
  type: string;

  @Column({ default: StepStatus.PENDING })
  status: string;

  @Column({ type: 'int', default: 1 })
  order: number;

  @Column({ type: 'jsonb', nullable: true })
  config: {
    assignToRoles?: string[];
    assignToUsers?: string[];
    requiredFields?: string[];
    conditions?: {
      field: string;
      operator:
        | 'equals'
        | 'not_equals'
        | 'contains'
        | 'greater_than'
        | 'less_than';
      value: any;
    }[];
    actions?: {
      type:
        | 'create_entity'
        | 'update_entity'
        | 'send_notification'
        | 'update_field';
      config?: any;
    }[];
    timeLimit?: number; // in hours
  };

  @Column({ type: 'jsonb', nullable: true })
  validationRules: {
    required: string[];
    fieldValidations: {
      field: string;
      type: 'required' | 'format' | 'range';
      rule: any;
    }[];
  };

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ nullable: true })
  workflowId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'completedById' })
  completedBy: User;

  @Column({ nullable: true })
  completedById: string;

  @Column({ type: 'jsonb', nullable: true })
  result: {
    success: boolean;
    data?: any;
    error?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

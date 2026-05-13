import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowState } from './workflow-state.entity';
import { Role } from '../roles/role.entity';

@Entity('workflow_transitions')
export class WorkflowTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => WorkflowState)
  @JoinColumn({ name: 'fromStateId' })
  fromState: WorkflowState;

  @Column()
  fromStateId: string;

  @ManyToOne(() => WorkflowState)
  @JoinColumn({ name: 'toStateId' })
  toState: WorkflowState;

  @Column()
  toStateId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'requiredRoleId' })
  requiredRole: Role;

  @Column({ nullable: true })
  requiredRoleId: string;

  @Column({ type: 'jsonb', nullable: true })
  conditions: {
    field?: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value?: any;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  actions: {
    type?: 'create_task' | 'send_notification' | 'update_field';
    config?: Record<string, any>;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

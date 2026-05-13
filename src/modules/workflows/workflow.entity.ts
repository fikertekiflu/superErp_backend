import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Entity as DynamicEntity } from '../entities/entity.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowState } from './workflow-state.entity';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum WorkflowTrigger {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  EVENT_BASED = 'event_based',
  WEBHOOK = 'webhook',
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: WorkflowStatus.DRAFT })
  status: string;

  @Column({ default: WorkflowTrigger.MANUAL })
  trigger: string;

  @Column({ type: 'jsonb', nullable: true })
  config: {
    assignToRoles?: string[];
    assignToUsers?: string[];
    requiredFields?: string[];
    autoStart?: boolean;
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  entityAssignments: {
    entityId: string;
    permissions: {
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    };
  }[];

  @OneToMany(() => WorkflowStep, (step) => step.workflow)
  steps: WorkflowStep[];

  @OneToMany(() => WorkflowState, (state) => state.workflow)
  states: WorkflowState[];

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User;

  @Column({ nullable: true })
  updatedById: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

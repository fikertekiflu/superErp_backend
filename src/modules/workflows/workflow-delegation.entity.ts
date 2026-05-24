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

@Entity('workflow_delegations')
export class WorkflowDelegation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  delegatorUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'delegatorUserId' })
  delegator: User;

  @Column()
  delegateUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'delegateUserId' })
  delegate: User;

  /** If empty, delegate may act on all roles the delegator holds */
  @Column({ type: 'simple-array', nullable: true })
  roleIds: string[];

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

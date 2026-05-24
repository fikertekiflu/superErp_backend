import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

export interface RoleEntityPermission {
  entityId: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: [] })
  entityPermissions: RoleEntityPermission[];

  /** Max amount this role may approve (null = unlimited) */
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  maxApprovalAmount?: number | null;

  @ManyToOne(() => Tenant, { nullable: true })
  tenant?: Tenant;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable()
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

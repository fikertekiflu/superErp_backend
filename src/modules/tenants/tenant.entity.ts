import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  PENDING_VERIFICATION = 'pending_verification',
  REJECTED = 'rejected',
}

export enum TenantPlan {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  domain: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING_VERIFICATION,
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.BASIC,
  })
  plan: TenantPlan;

  @Column({ nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ default: 10 })
  maxUsers: number;

  @Column({ default: 100 })
  maxStorageMB: number;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ default: false })
  isOnboarded: boolean;

  // Verification fields
  @Column({ default: 'pending' })
  verificationStatus: string; // 'pending' | 'submitted' | 'approved' | 'rejected'

  @Column({ type: 'jsonb', nullable: true })
  verificationDocuments: Array<{ name: string; fileUrl: string; type: string; uploadedAt: string }>;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('User', 'tenant')
  users: any[];

  @OneToMany('Role', 'tenant')
  roles: any[];
}

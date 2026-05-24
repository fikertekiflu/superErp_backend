import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  ENTITY_CREATED = 'entity_created',
  ENTITY_UPDATED = 'entity_updated',
  ENTITY_DELETED = 'entity_deleted',
  ENTITY_DATA_CREATED = 'entity_data_created',
  ENTITY_DATA_UPDATED = 'entity_data_updated',
  ENTITY_DATA_DELETED = 'entity_data_deleted',
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  ROLE_PERMISSIONS_UPDATED = 'role_permissions_updated',
  USER_CREATED = 'user_created',
  TENANT_APPROVED = 'tenant_approved',
  TENANT_REJECTED = 'tenant_rejected',
  WORKFLOW_TRANSITION = 'workflow_transition',
}

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId?: string;

  @Column({ nullable: true })
  actorId?: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column()
  resourceType: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column({ nullable: true })
  resourceName?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}

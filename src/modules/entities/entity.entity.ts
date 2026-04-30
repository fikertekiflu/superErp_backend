import {
  Entity as TypeORMEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  EMAIL = 'email',
  PHONE = 'phone',
  TEXT = 'text',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  FILE = 'file',
  IMAGE = 'image',
  DECIMAL = 'decimal',
  INTEGER = 'integer',
}

@TypeORMEntity('entities')
@Index(['slug', 'tenantId'], { unique: true })
export class Entity {
  @ApiProperty({ description: 'Entity unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Product', description: 'Entity display name' })
  @Column()
  name: string;

  @ApiProperty({
    example: 'product',
    description: 'Entity system name (lowercase, no spaces)',
  })
  @Column()
  slug: string;

  @ApiProperty({
    example: 'Products in inventory',
    description: 'Entity description',
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    example: ['name', 'price', 'quantity'],
    description: 'Field definitions',
  })
  @Column({ type: 'jsonb' })
  fields: FieldDefinition[];

  @ApiProperty({
    example: 'active',
    enum: EntityStatus,
    description: 'Entity status',
  })
  @Column({ type: 'enum', enum: EntityStatus, default: EntityStatus.ACTIVE })
  status: EntityStatus;

  @ApiProperty({ example: 'fa-box', description: 'Icon for UI display' })
  @Column({ nullable: true })
  icon: string;

  @ApiProperty({
    example: true,
    description: 'Whether entity is available in menu',
  })
  @Column({ default: true })
  isInMenu: boolean;

  @ApiProperty({ example: 10, description: 'Display order in menu' })
  @Column({ default: 0 })
  menuOrder: number;

  @ApiProperty({ description: 'Tenant that owns this entity' })
  @ManyToOne('Tenant', 'entities')
  tenant: any;

  @ApiProperty({ description: 'Tenant ID' })
  @Column({ nullable: true })
  tenantId: string;

  @ApiProperty({ description: 'User who created this entity' })
  @ManyToOne('User', 'entities')
  createdBy: any;

  @ApiProperty({ description: 'User ID who created this entity' })
  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @OneToMany('EntityData', 'entity')
  data: any[];
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: any;
  options?: string[]; // For select/multi_select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  display: {
    order: number;
    width?: string;
    showInList?: boolean;
    showInForm?: boolean;
    searchable?: boolean;
  };
}

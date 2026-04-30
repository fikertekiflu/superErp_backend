import {
  Entity as TypeORMEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@TypeORMEntity('entity_data')
export class EntityData {
  @ApiProperty({ description: 'Data record unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Entity this data belongs to' })
  @ManyToOne('Entity', 'data')
  entity: any;

  @ApiProperty({ description: 'Entity ID' })
  @Column()
  entityId: string;

  @ApiProperty({ description: 'Dynamic field values stored as JSON' })
  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @ApiProperty({ description: 'Tenant that owns this data' })
  @ManyToOne('Tenant', 'entityData')
  tenant: any;

  @ApiProperty({ description: 'Tenant ID' })
  @Column({ nullable: true })
  tenantId: string;

  @ApiProperty({ description: 'User who created this data' })
  @ManyToOne('User', 'entityData')
  createdBy: any;

  @ApiProperty({ description: 'User ID who created this data' })
  @Column({ nullable: true })
  createdById: string;

  @ApiProperty({ description: 'User who last updated this data' })
  @ManyToOne('User', 'updatedEntityData')
  updatedBy: any;

  @ApiProperty({ description: 'User ID who last updated this data' })
  @Column({ nullable: true })
  updatedById: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ default: 'each' })
  unit: string;

  @Column({ default: 'ETB' })
  currency: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  taxRate: number;

  @Column({ type: 'int', nullable: true })
  stockQuantity: number;

  @Column({ type: 'varchar', length: 512, nullable: true })
  imagePath: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

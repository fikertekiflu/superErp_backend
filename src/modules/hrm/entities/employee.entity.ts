import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phoneNumber: string;

  @Column()
  position: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  tinNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  basicSalary: number;

  @Column()
  hireDate: Date;

  @Column({ default: 'active' })
  status: 'active' | 'on_leave' | 'terminated';

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

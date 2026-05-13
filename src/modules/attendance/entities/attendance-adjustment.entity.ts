import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { Employee } from '../../hrm/entities/employee.entity';
import { Attendance } from './attendance.entity';

export enum AdjustmentType {
  CHECK_IN_ADJUSTMENT = 'check_in_adjustment',
  CHECK_OUT_ADJUSTMENT = 'check_out_adjustment',
  STATUS_CHANGE = 'status_change',
  OVERTIME_ADJUSTMENT = 'overtime_adjustment',
  MANUAL_ADDITION = 'manual_addition',
  CORRECTION = 'correction'
}

export enum AdjustmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('attendance_adjustments')
export class AttendanceAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  attendanceId: string;

  @ManyToOne(() => Attendance)
  attendance: Attendance;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  employee: Employee;

  @Column({ 
    type: 'enum', 
    enum: AdjustmentType 
  })
  adjustmentType: AdjustmentType;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'time', nullable: true })
  originalCheckIn: Date;

  @Column({ type: 'time', nullable: true })
  newCheckIn: Date;

  @Column({ type: 'time', nullable: true })
  originalCheckOut: Date;

  @Column({ type: 'time', nullable: true })
  newCheckOut: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  originalTotalHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  newTotalHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  originalOvertimeHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  newOvertimeHours: number;

  @Column({ type: 'json', nullable: true })
  originalStatus: string;

  @Column({ type: 'json', nullable: true })
  newStatus: string;

  @Column({ 
    type: 'enum', 
    enum: AdjustmentStatus, 
    default: AdjustmentStatus.PENDING 
  })
  status: AdjustmentStatus;

  @Column({ nullable: true })
  requestedById: string;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'json', nullable: true })
  supportingDocuments: {
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
  }[];

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

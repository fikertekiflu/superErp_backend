import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';

export enum PolicyType {
  REGULAR = 'regular',
  FLEXIBLE = 'flexible',
  SHIFT = 'shift',
  REMOTE = 'remote'
}

export enum GracePeriodType {
  MINUTES = 'minutes',
  PERCENTAGE = 'percentage'
}

@Entity('attendance_policies')
export class AttendancePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: PolicyType, 
    default: PolicyType.REGULAR 
  })
  policyType: PolicyType;

  @Column({ type: 'time', nullable: true })
  standardCheckIn: Date;

  @Column({ type: 'time', nullable: true })
  standardCheckOut: Date;

  @Column({ type: 'time', nullable: true })
  lunchStart: Date;

  @Column({ type: 'time', nullable: true })
  lunchEnd: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 8 })
  requiredWorkHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  gracePeriodMinutes: number;

  @Column({ 
    type: 'enum', 
    enum: GracePeriodType, 
    default: GracePeriodType.MINUTES 
  })
  gracePeriodType: GracePeriodType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  lateThresholdMinutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 30 })
  halfDayThresholdMinutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 240 })
  absentThresholdMinutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weekendOvertimeRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  holidayOvertimeRate: number;

  @Column({ type: 'json', nullable: true })
  workingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };

  @Column({ type: 'json', nullable: true })
  shiftSettings: {
    morningShift?: { start: string; end: string };
    eveningShift?: { start: string; end: string };
    nightShift?: { start: string; end: string };
  };

  @Column({ type: 'json', nullable: true })
  flexibleSettings: {
    coreHoursStart: string;
    coreHoursEnd: string;
    minWorkHours: number;
    maxWorkHours: number;
  };

  @Column({ type: 'json', nullable: true })
  remoteSettings: {
    requireCheckIn: boolean;
    requireActivityTracking: boolean;
    allowFlexibleHours: boolean;
  };

  @Column({ default: true })
  isAutoApprovalEnabled: boolean;

  @Column({ default: false })
  requireLocationCheck: boolean;

  @Column({ type: 'json', nullable: true })
  allowedLocations: {
    latitude: number;
    longitude: number;
    radius: number; // meters
    name: string;
  }[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

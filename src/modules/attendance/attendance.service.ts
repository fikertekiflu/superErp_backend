import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Equal } from 'typeorm';
import { Attendance, AttendanceStatus, CheckType } from './entities/attendance.entity';
import { AttendanceLog } from './entities/attendance.entity';
import { AttendancePolicy } from './entities/attendance-policy.entity';
import { AttendanceAdjustment, AdjustmentType, AdjustmentStatus } from './entities/attendance-adjustment.entity';
import { EntityData } from '../entities/entity-data.entity';
import { Employee } from '../hrm/entities/employee.entity';
import { Tenant } from '../tenants/tenant.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(AttendanceLog)
    private attendanceLogRepository: Repository<AttendanceLog>,
    @InjectRepository(AttendancePolicy)
    private policyRepository: Repository<AttendancePolicy>,
    @InjectRepository(AttendanceAdjustment)
    private adjustmentRepository: Repository<AttendanceAdjustment>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async checkIn(
    employeeId: string,
    data: {
      notes?: string;
    },
    tenantId: string,
    targetDate?: Date  // optional: used by HR override to specify a different date
  ): Promise<Attendance> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, tenantId }
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Use the provided date or default to today
    const checkDate = targetDate || new Date();
    const checkDateStr = checkDate.toISOString().split('T')[0];

    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        attendanceDate: Equal(checkDateStr) as any,
        tenantId
      }
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      throw new BadRequestException(`Already checked in for ${checkDateStr}`);
    }

    // Get applicable policy
    const policy = await this.getApplicablePolicy(employeeId, tenantId);

    // Create or update attendance record
    const attendance = existingAttendance || this.attendanceRepository.create({
      employeeId,
      attendanceDate: checkDateStr as any,
      tenantId
    });

    // Set check-in time
    attendance.checkInTime = new Date();
    if (policy?.standardCheckIn) attendance.scheduledCheckIn = policy.standardCheckIn;
    if (policy?.standardCheckOut) attendance.scheduledCheckOut = policy.standardCheckOut;
    attendance.status = AttendanceStatus.PRESENT;
    attendance.policy = policy || null;

    // Calculate lateness
    if (policy && attendance.checkInTime > policy.standardCheckIn) {
      const lateMinutes = this.calculateMinutesDifference(
        policy.standardCheckIn,
        attendance.checkInTime
      );
      attendance.lateMinutes = Math.max(0, lateMinutes - policy.gracePeriodMinutes);

      if (attendance.lateMinutes > policy.lateThresholdMinutes) {
        attendance.status = AttendanceStatus.LATE;
      }
    }

    // Create check-in log
    const checkInLog = this.attendanceLogRepository.create({
      employeeId,
      checkType: CheckType.CHECK_IN,
      checkTime: new Date(),
      notes: data.notes,
      isManual: false,
      tenantId
    });

    await this.attendanceRepository.save(attendance);
    await this.attendanceLogRepository.save(checkInLog);

    return attendance;
  }

  async checkOut(
    employeeId: string,
    data: {
      notes?: string;
    },
    tenantId: string,
    targetDate?: Date  // optional: used by HR override to specify a different date
  ): Promise<Attendance> {
    // Use the provided date or default to today
    const checkDate = targetDate || new Date();
    const checkDateStr = checkDate.toISOString().split('T')[0];

    const attendance = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        attendanceDate: Equal(checkDateStr) as any,
        tenantId
      },
      relations: ['policy']
    });

    if (!attendance || !attendance.checkInTime) {
      throw new BadRequestException(`No check-in record found for ${checkDateStr}`);
    }

    if (attendance.checkOutTime) {
      throw new BadRequestException(`Already checked out for ${checkDateStr}`);
    }

    // Update checkout time
    attendance.checkOutTime = new Date();

    // Calculate total hours
    const totalMinutes = this.calculateMinutesDifference(
      attendance.checkInTime,
      attendance.checkOutTime
    );
    attendance.totalHours = totalMinutes / 60;

    // Calculate overtime
    const policy = attendance.policy;
    if (policy) {
      const requiredMinutes = policy.requiredWorkHours * 60;
      if (totalMinutes > requiredMinutes) {
        attendance.overtimeHours = (totalMinutes - requiredMinutes) / 60;
      }

      // Calculate early departure
      if (attendance.checkOutTime < policy.standardCheckOut) {
        attendance.earlyDepartureMinutes = this.calculateMinutesDifference(
          attendance.checkOutTime,
          policy.standardCheckOut
        );
      }

      // Check for half-day
      if (totalMinutes < policy.halfDayThresholdMinutes) {
        attendance.status = AttendanceStatus.HALF_DAY;
      }
    }

    // Create check-out log
    const checkOutLog = this.attendanceLogRepository.create({
      employeeId,
      checkType: CheckType.CHECK_OUT,
      checkTime: new Date(),
      notes: data.notes,
      isManual: false,
      tenantId
    });

    await this.attendanceRepository.save(attendance);
    await this.attendanceLogRepository.save(checkOutLog);

    return attendance;
  }

  async getAttendanceByDate(
    employeeId: string,
    date: Date,
    tenantId: string
  ): Promise<Attendance | null> {
    // Format to YYYY-MM-DD to match PostgreSQL `date` column exactly
    const dateStr = new Date(date).toISOString().split('T')[0];

    return this.attendanceRepository.findOne({
      where: {
        employeeId,
        attendanceDate: Equal(dateStr) as any,
        tenantId
      },
      relations: ['policy', 'logs']
    });
  }

  async getAttendanceHistory(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<Attendance[]> {
    // Format as YYYY-MM-DD strings so Between matches the PostgreSQL `date` column correctly
    const startStr = new Date(startDate).toISOString().split('T')[0];
    const endStr = new Date(endDate).toISOString().split('T')[0];

    return this.attendanceRepository.find({
      where: {
        employeeId,
        attendanceDate: Between(startStr, endStr) as any,
        tenantId
      },
      relations: ['policy', 'adjustments'],
      order: { attendanceDate: 'DESC' }
    });
  }

  async getAttendanceSummary(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    totalHours: number;
    overtimeHours: number;
    averageHours: number;
  }> {
    const attendances = await this.getAttendanceHistory(employeeId, startDate, endDate, tenantId);
    
    const summary = attendances.reduce((acc, attendance) => {
      acc.totalDays++;
      acc.totalHours += Number(attendance.totalHours || 0);
      acc.overtimeHours += Number(attendance.overtimeHours || 0);

      switch (attendance.status) {
        case AttendanceStatus.PRESENT:
          acc.presentDays++;
          break;
        case AttendanceStatus.ABSENT:
          acc.absentDays++;
          break;
        case AttendanceStatus.LATE:
          acc.lateDays++;
          break;
        case AttendanceStatus.HALF_DAY:
          acc.halfDays++;
          break;
      }

      return acc;
    }, {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      totalHours: 0,
      overtimeHours: 0,
      averageHours: 0
    });

    summary.averageHours = summary.totalDays > 0 ? summary.totalHours / summary.totalDays : 0;

    return summary;
  }

  async requestAdjustment(
    employeeId: string,
    data: {
      attendanceId: string;
      adjustmentType: AdjustmentType;
      reason: string;
      description?: string;
      newCheckIn?: Date;
      newCheckOut?: Date;
      newStatus?: AttendanceStatus;
      supportingDocuments?: Array<{ fileName: string; fileUrl: string }>;
    },
    tenantId: string
  ): Promise<AttendanceAdjustment> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: data.attendanceId, employeeId, tenantId }
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    const adjustment = this.adjustmentRepository.create({
      attendanceId: data.attendanceId,
      employeeId,
      adjustmentType: data.adjustmentType,
      reason: data.reason,
      description: data.description,
      originalCheckIn: attendance.checkInTime,
      originalCheckOut: attendance.checkOutTime,
      originalTotalHours: attendance.totalHours,
      originalOvertimeHours: attendance.overtimeHours,
      originalStatus: attendance.status,
      newCheckIn: data.newCheckIn,
      newCheckOut: data.newCheckOut,
      newStatus: data.newStatus,
      supportingDocuments: data.supportingDocuments?.map(doc => ({
        ...doc,
        uploadedAt: new Date()
      })),
      tenantId
    });

    return this.adjustmentRepository.save(adjustment);
  }

  async approveAdjustment(
    adjustmentId: string,
    approvedById: string,
    tenantId: string,
    approved: boolean = true,
    rejectionReason?: string
  ): Promise<AttendanceAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({
      where: { id: adjustmentId, tenantId },
      relations: ['attendance']
    });

    if (!adjustment) {
      throw new NotFoundException('Adjustment request not found');
    }

    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException('Adjustment already processed');
    }

    adjustment.status = approved ? AdjustmentStatus.APPROVED : AdjustmentStatus.REJECTED;
    adjustment.approvedById = approvedById;
    adjustment.approvedAt = new Date();

    if (!approved && rejectionReason) {
      adjustment.rejectionReason = rejectionReason;
    }

    if (approved) {
      // Apply the adjustment to the attendance record
      const attendance = adjustment.attendance;
      
      if (adjustment.newCheckIn) attendance.checkInTime = adjustment.newCheckIn;
      if (adjustment.newCheckOut) attendance.checkOutTime = adjustment.newCheckOut;
      if (adjustment.newStatus) attendance.status = adjustment.newStatus as AttendanceStatus;

      // Recalculate hours if check-in/out changed
      if (adjustment.newCheckIn || adjustment.newCheckOut) {
        const totalMinutes = this.calculateMinutesDifference(
          attendance.checkInTime,
          attendance.checkOutTime
        );
        attendance.totalHours = totalMinutes / 60;
      }

      await this.attendanceRepository.save(attendance);
    }

    return this.adjustmentRepository.save(adjustment);
  }

  private async getApplicablePolicy(employeeId: string, tenantId: string): Promise<AttendancePolicy | null> {
    // For now, return the first active policy
    // In a real implementation, this would check employee assignments, department policies, etc.
    return this.policyRepository.findOne({
      where: {
        tenantId,
        isActive: true,
        effectiveFrom: LessThanOrEqual(new Date()),
        effectiveTo: MoreThanOrEqual(new Date())
      }
    });
  }

  private calculateMinutesDifference(startTime: Date, endTime: Date): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }

  async getDailyAttendance(date: Date, tenantId: string): Promise<Attendance[]> {
    // Use date-only string so Equal matches the PostgreSQL `date` column exactly
    const dateStr = new Date(date).toISOString().split('T')[0];

    return this.attendanceRepository.find({
      where: {
        attendanceDate: Equal(dateStr) as any,
        tenantId
      },
      relations: ['employee'],
      order: { checkInTime: 'ASC' }
    });
  }

  async getAllEmployeesSummary(
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<{
    totalEmployees: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    totalHours: number;
    overtimeHours: number;
    averageHours: number;
    employeeSummaries: Array<{
      employeeId: string;
      employeeName: string;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      totalHours: number;
    }>;
  }> {
    // Get all employees for the tenant
    const employees = await this.employeeRepository.find({
      where: { tenantId }
    });

    const employeeSummaries: Array<{
      employeeId: string;
      employeeName: string;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      totalHours: number;
    }> = [];
    let totalPresentDays = 0;
    let totalAbsentDays = 0;
    let totalLateDays = 0;
    let totalHalfDays = 0;
    let totalHours = 0;
    let totalOvertimeHours = 0;

    for (const employee of employees) {
      const summary = await this.getAttendanceSummary(
        employee.id,
        startDate,
        endDate,
        tenantId
      );

      totalPresentDays += summary.presentDays;
      totalAbsentDays += summary.absentDays;
      totalLateDays += summary.lateDays;
      totalHalfDays += summary.halfDays;
      totalHours += summary.totalHours;
      totalOvertimeHours += summary.overtimeHours;

      employeeSummaries.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        presentDays: summary.presentDays,
        absentDays: summary.absentDays,
        lateDays: summary.lateDays,
        totalHours: summary.totalHours
      });
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const averageHours = totalPresentDays > 0 ? totalHours / totalPresentDays : 0;

    return {
      totalEmployees: employees.length,
      totalDays,
      presentDays: totalPresentDays,
      absentDays: totalAbsentDays,
      lateDays: totalLateDays,
      halfDays: totalHalfDays,
      totalHours,
      overtimeHours: totalOvertimeHours,
      averageHours,
      employeeSummaries
    };
  }
}

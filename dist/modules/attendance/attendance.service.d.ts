import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { AttendanceLog } from './entities/attendance.entity';
import { AttendancePolicy } from './entities/attendance-policy.entity';
import { AttendanceAdjustment, AdjustmentType, AdjustmentStatus } from './entities/attendance-adjustment.entity';
import { Employee } from '../hrm/entities/employee.entity';
import { Tenant } from '../tenants/tenant.entity';
export declare class AttendanceService {
    private attendanceRepository;
    private attendanceLogRepository;
    private policyRepository;
    private adjustmentRepository;
    private employeeRepository;
    private tenantRepository;
    constructor(attendanceRepository: Repository<Attendance>, attendanceLogRepository: Repository<AttendanceLog>, policyRepository: Repository<AttendancePolicy>, adjustmentRepository: Repository<AttendanceAdjustment>, employeeRepository: Repository<Employee>, tenantRepository: Repository<Tenant>);
    checkIn(employeeId: string, data: {
        notes?: string;
    }, tenantId: string, targetDate?: Date): Promise<Attendance>;
    checkOut(employeeId: string, data: {
        notes?: string;
    }, tenantId: string, targetDate?: Date): Promise<Attendance>;
    getAttendanceByDate(employeeId: string, date: Date, tenantId: string): Promise<Attendance | null>;
    getAttendanceHistory(employeeId: string, startDate: Date, endDate: Date, tenantId: string): Promise<Attendance[]>;
    getAttendanceSummary(employeeId: string, startDate: Date, endDate: Date, tenantId: string): Promise<{
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        halfDays: number;
        totalHours: number;
        overtimeHours: number;
        averageHours: number;
    }>;
    requestAdjustment(employeeId: string, data: {
        attendanceId: string;
        adjustmentType: AdjustmentType;
        reason: string;
        description?: string;
        newCheckIn?: Date;
        newCheckOut?: Date;
        newStatus?: AttendanceStatus;
        supportingDocuments?: Array<{
            fileName: string;
            fileUrl: string;
        }>;
    }, tenantId: string): Promise<AttendanceAdjustment>;
    approveAdjustment(adjustmentId: string, approvedById: string, tenantId: string, approved?: boolean, rejectionReason?: string): Promise<AttendanceAdjustment>;
    private getApplicablePolicy;
    private calculateMinutesDifference;
    getDailyAttendance(date: Date, tenantId: string): Promise<Attendance[]>;
    getAllEmployeesSummary(startDate: Date, endDate: Date, tenantId: string): Promise<{
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
    }>;
    getTeamAttendance(date: Date, tenantId: string): Promise<Attendance[]>;
    listAdjustments(tenantId: string, status?: AdjustmentStatus, employeeId?: string): Promise<AttendanceAdjustment[]>;
    listAttendanceLogs(tenantId: string, startDate: Date, endDate: Date, employeeId?: string): Promise<AttendanceLog[]>;
    listPolicies(tenantId: string): Promise<AttendancePolicy[]>;
    createPolicy(tenantId: string, policyData: Partial<AttendancePolicy>): Promise<AttendancePolicy>;
}

import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { AttendanceLog } from './entities/attendance.entity';
import { AttendanceAdjustment, AdjustmentType, AdjustmentStatus } from './entities/attendance-adjustment.entity';
import { AttendancePolicy } from './entities/attendance-policy.entity';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(body: {
        notes?: string;
    }, req: any): Promise<Attendance>;
    hrCheckIn(body: {
        employeeId: string;
        notes?: string;
    }, req: any): Promise<Attendance>;
    checkOut(body: {
        notes?: string;
    }, req: any): Promise<Attendance>;
    hrCheckOut(body: {
        employeeId: string;
        notes?: string;
    }, req: any): Promise<Attendance>;
    getTodayAttendance(req: any): Promise<Attendance | null>;
    getAttendanceHistory(startDate: string, endDate: string, req: any, employeeId?: string): Promise<Attendance[]>;
    getAttendanceSummary(startDate: string, endDate: string, req: any, employeeId?: string): Promise<{
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        halfDays: number;
        totalHours: number;
        overtimeHours: number;
        averageHours: number;
    }>;
    getTeamAttendance(req: any, date?: string): Promise<Attendance[]>;
    getDailyAttendance(req: any, date?: string): Promise<Attendance[]>;
    getAttendanceSummaryForAllEmployees(startDate: string, endDate: string, req: any): Promise<{
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
    requestAdjustment(body: {
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
    }, req: any): Promise<AttendanceAdjustment>;
    getAdjustments(req: any, status?: AdjustmentStatus, employeeId?: string): Promise<AttendanceAdjustment[]>;
    approveAdjustment(id: string, body: {
        approved: boolean;
        rejectionReason?: string;
    }, req: any): Promise<AttendanceAdjustment>;
    getAttendanceLogs(startDate: string, endDate: string, req: any, employeeId?: string): Promise<AttendanceLog[]>;
    getPolicies(req: any): Promise<AttendancePolicy[]>;
    createPolicy(policyData: Partial<AttendancePolicy>, req: any): Promise<AttendancePolicy>;
}

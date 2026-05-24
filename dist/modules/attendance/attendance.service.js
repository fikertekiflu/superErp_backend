"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_entity_1 = require("./entities/attendance.entity");
const attendance_entity_2 = require("./entities/attendance.entity");
const attendance_policy_entity_1 = require("./entities/attendance-policy.entity");
const attendance_adjustment_entity_1 = require("./entities/attendance-adjustment.entity");
const employee_entity_1 = require("../hrm/entities/employee.entity");
const tenant_entity_1 = require("../tenants/tenant.entity");
let AttendanceService = class AttendanceService {
    attendanceRepository;
    attendanceLogRepository;
    policyRepository;
    adjustmentRepository;
    employeeRepository;
    tenantRepository;
    constructor(attendanceRepository, attendanceLogRepository, policyRepository, adjustmentRepository, employeeRepository, tenantRepository) {
        this.attendanceRepository = attendanceRepository;
        this.attendanceLogRepository = attendanceLogRepository;
        this.policyRepository = policyRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.employeeRepository = employeeRepository;
        this.tenantRepository = tenantRepository;
    }
    async checkIn(employeeId, data, tenantId, targetDate) {
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId, tenantId }
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        const checkDate = targetDate || new Date();
        const checkDateStr = checkDate.toISOString().split('T')[0];
        const existingAttendance = await this.attendanceRepository.findOne({
            where: {
                employeeId,
                attendanceDate: (0, typeorm_2.Equal)(checkDateStr),
                tenantId
            }
        });
        if (existingAttendance && existingAttendance.checkInTime) {
            throw new common_1.BadRequestException(`Already checked in for ${checkDateStr}`);
        }
        const policy = await this.getApplicablePolicy(employeeId, tenantId);
        const attendance = existingAttendance || this.attendanceRepository.create({
            employeeId,
            attendanceDate: checkDateStr,
            tenantId
        });
        attendance.checkInTime = new Date();
        if (policy?.standardCheckIn)
            attendance.scheduledCheckIn = policy.standardCheckIn;
        if (policy?.standardCheckOut)
            attendance.scheduledCheckOut = policy.standardCheckOut;
        attendance.status = attendance_entity_1.AttendanceStatus.PRESENT;
        attendance.policy = policy || null;
        if (policy && attendance.checkInTime > policy.standardCheckIn) {
            const lateMinutes = this.calculateMinutesDifference(policy.standardCheckIn, attendance.checkInTime);
            attendance.lateMinutes = Math.max(0, lateMinutes - policy.gracePeriodMinutes);
            if (attendance.lateMinutes > policy.lateThresholdMinutes) {
                attendance.status = attendance_entity_1.AttendanceStatus.LATE;
            }
        }
        const checkInLog = this.attendanceLogRepository.create({
            employeeId,
            checkType: attendance_entity_1.CheckType.CHECK_IN,
            checkTime: new Date(),
            notes: data.notes,
            isManual: false,
            tenantId
        });
        await this.attendanceRepository.save(attendance);
        await this.attendanceLogRepository.save(checkInLog);
        return attendance;
    }
    async checkOut(employeeId, data, tenantId, targetDate) {
        const checkDate = targetDate || new Date();
        const checkDateStr = checkDate.toISOString().split('T')[0];
        const attendance = await this.attendanceRepository.findOne({
            where: {
                employeeId,
                attendanceDate: (0, typeorm_2.Equal)(checkDateStr),
                tenantId
            },
            relations: ['policy']
        });
        if (!attendance || !attendance.checkInTime) {
            throw new common_1.BadRequestException(`No check-in record found for ${checkDateStr}`);
        }
        if (attendance.checkOutTime) {
            throw new common_1.BadRequestException(`Already checked out for ${checkDateStr}`);
        }
        attendance.checkOutTime = new Date();
        const totalMinutes = this.calculateMinutesDifference(attendance.checkInTime, attendance.checkOutTime);
        attendance.totalHours = totalMinutes / 60;
        const policy = attendance.policy;
        if (policy) {
            const requiredMinutes = policy.requiredWorkHours * 60;
            if (totalMinutes > requiredMinutes) {
                attendance.overtimeHours = (totalMinutes - requiredMinutes) / 60;
            }
            if (attendance.checkOutTime < policy.standardCheckOut) {
                attendance.earlyDepartureMinutes = this.calculateMinutesDifference(attendance.checkOutTime, policy.standardCheckOut);
            }
            if (totalMinutes < policy.halfDayThresholdMinutes) {
                attendance.status = attendance_entity_1.AttendanceStatus.HALF_DAY;
            }
        }
        const checkOutLog = this.attendanceLogRepository.create({
            employeeId,
            checkType: attendance_entity_1.CheckType.CHECK_OUT,
            checkTime: new Date(),
            notes: data.notes,
            isManual: false,
            tenantId
        });
        await this.attendanceRepository.save(attendance);
        await this.attendanceLogRepository.save(checkOutLog);
        return attendance;
    }
    async getAttendanceByDate(employeeId, date, tenantId) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        return this.attendanceRepository.findOne({
            where: {
                employeeId,
                attendanceDate: (0, typeorm_2.Equal)(dateStr),
                tenantId
            },
            relations: ['policy', 'logs']
        });
    }
    async getAttendanceHistory(employeeId, startDate, endDate, tenantId) {
        const startStr = new Date(startDate).toISOString().split('T')[0];
        const endStr = new Date(endDate).toISOString().split('T')[0];
        return this.attendanceRepository.find({
            where: {
                employeeId,
                attendanceDate: (0, typeorm_2.Between)(startStr, endStr),
                tenantId
            },
            relations: ['policy', 'adjustments'],
            order: { attendanceDate: 'DESC' }
        });
    }
    async getAttendanceSummary(employeeId, startDate, endDate, tenantId) {
        const attendances = await this.getAttendanceHistory(employeeId, startDate, endDate, tenantId);
        const summary = attendances.reduce((acc, attendance) => {
            acc.totalDays++;
            acc.totalHours += Number(attendance.totalHours || 0);
            acc.overtimeHours += Number(attendance.overtimeHours || 0);
            switch (attendance.status) {
                case attendance_entity_1.AttendanceStatus.PRESENT:
                    acc.presentDays++;
                    break;
                case attendance_entity_1.AttendanceStatus.ABSENT:
                    acc.absentDays++;
                    break;
                case attendance_entity_1.AttendanceStatus.LATE:
                    acc.lateDays++;
                    break;
                case attendance_entity_1.AttendanceStatus.HALF_DAY:
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
    async requestAdjustment(employeeId, data, tenantId) {
        const attendance = await this.attendanceRepository.findOne({
            where: { id: data.attendanceId, employeeId, tenantId }
        });
        if (!attendance) {
            throw new common_1.NotFoundException('Attendance record not found');
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
    async approveAdjustment(adjustmentId, approvedById, tenantId, approved = true, rejectionReason) {
        const adjustment = await this.adjustmentRepository.findOne({
            where: { id: adjustmentId, tenantId },
            relations: ['attendance']
        });
        if (!adjustment) {
            throw new common_1.NotFoundException('Adjustment request not found');
        }
        if (adjustment.status !== attendance_adjustment_entity_1.AdjustmentStatus.PENDING) {
            throw new common_1.BadRequestException('Adjustment already processed');
        }
        adjustment.status = approved ? attendance_adjustment_entity_1.AdjustmentStatus.APPROVED : attendance_adjustment_entity_1.AdjustmentStatus.REJECTED;
        adjustment.approvedById = approvedById;
        adjustment.approvedAt = new Date();
        if (!approved && rejectionReason) {
            adjustment.rejectionReason = rejectionReason;
        }
        if (approved) {
            const attendance = adjustment.attendance;
            if (adjustment.newCheckIn)
                attendance.checkInTime = adjustment.newCheckIn;
            if (adjustment.newCheckOut)
                attendance.checkOutTime = adjustment.newCheckOut;
            if (adjustment.newStatus)
                attendance.status = adjustment.newStatus;
            if (adjustment.newCheckIn || adjustment.newCheckOut) {
                const totalMinutes = this.calculateMinutesDifference(attendance.checkInTime, attendance.checkOutTime);
                attendance.totalHours = totalMinutes / 60;
            }
            await this.attendanceRepository.save(attendance);
        }
        return this.adjustmentRepository.save(adjustment);
    }
    async getApplicablePolicy(employeeId, tenantId) {
        return this.policyRepository.findOne({
            where: {
                tenantId,
                isActive: true,
                effectiveFrom: (0, typeorm_2.LessThanOrEqual)(new Date()),
                effectiveTo: (0, typeorm_2.MoreThanOrEqual)(new Date())
            }
        });
    }
    calculateMinutesDifference(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return (end.getTime() - start.getTime()) / (1000 * 60);
    }
    async getDailyAttendance(date, tenantId) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        return this.attendanceRepository.find({
            where: {
                attendanceDate: (0, typeorm_2.Equal)(dateStr),
                tenantId
            },
            relations: ['employee'],
            order: { checkInTime: 'ASC' }
        });
    }
    async getAllEmployeesSummary(startDate, endDate, tenantId) {
        const employees = await this.employeeRepository.find({
            where: { tenantId }
        });
        const employeeSummaries = [];
        let totalPresentDays = 0;
        let totalAbsentDays = 0;
        let totalLateDays = 0;
        let totalHalfDays = 0;
        let totalHours = 0;
        let totalOvertimeHours = 0;
        for (const employee of employees) {
            const summary = await this.getAttendanceSummary(employee.id, startDate, endDate, tenantId);
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
    async getTeamAttendance(date, tenantId) {
        return this.getDailyAttendance(date, tenantId);
    }
    async listAdjustments(tenantId, status, employeeId) {
        const where = { tenantId };
        if (status)
            where.status = status;
        if (employeeId)
            where.employeeId = employeeId;
        return this.adjustmentRepository.find({
            where,
            relations: ['employee', 'attendance'],
            order: { createdAt: 'DESC' },
        });
    }
    async listAttendanceLogs(tenantId, startDate, endDate, employeeId) {
        const where = {
            tenantId,
            checkTime: (0, typeorm_2.Between)(startDate, endDate),
        };
        if (employeeId)
            where.employeeId = employeeId;
        return this.attendanceLogRepository.find({
            where,
            relations: ['employee'],
            order: { checkTime: 'DESC' },
        });
    }
    async listPolicies(tenantId) {
        return this.policyRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }
    async createPolicy(tenantId, policyData) {
        const policy = this.policyRepository.create({
            ...policyData,
            tenantId,
            isActive: policyData.isActive ?? true,
        });
        return this.policyRepository.save(policy);
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __param(1, (0, typeorm_1.InjectRepository)(attendance_entity_2.AttendanceLog)),
    __param(2, (0, typeorm_1.InjectRepository)(attendance_policy_entity_1.AttendancePolicy)),
    __param(3, (0, typeorm_1.InjectRepository)(attendance_adjustment_entity_1.AttendanceAdjustment)),
    __param(4, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(5, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map
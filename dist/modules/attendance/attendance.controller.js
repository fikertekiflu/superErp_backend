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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const attendance_service_1 = require("./attendance.service");
const attendance_adjustment_entity_1 = require("./entities/attendance-adjustment.entity");
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async checkIn(body, req) {
        const employeeId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.attendanceService.checkIn(employeeId, body, tenantId);
    }
    async hrCheckIn(body, req) {
        const tenantId = req.user.tenantId;
        const targetDate = body.date ? new Date(body.date) : new Date();
        return this.attendanceService.checkIn(body.employeeId, { notes: body.notes }, tenantId, targetDate);
    }
    async checkOut(body, req) {
        const employeeId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.attendanceService.checkOut(employeeId, body, tenantId);
    }
    async hrCheckOut(body, req) {
        const tenantId = req.user.tenantId;
        const targetDate = body.date ? new Date(body.date) : new Date();
        return this.attendanceService.checkOut(body.employeeId, { notes: body.notes }, tenantId, targetDate);
    }
    async getTodayAttendance(req) {
        const employeeId = req.user.userId;
        const tenantId = req.user.tenantId;
        const today = new Date();
        return this.attendanceService.getAttendanceByDate(employeeId, today, tenantId);
    }
    async getAttendanceHistory(startDate, endDate, req, employeeId) {
        const targetEmployeeId = employeeId || req.user.userId;
        const tenantId = req.user.tenantId;
        return this.attendanceService.getAttendanceHistory(targetEmployeeId, new Date(startDate), new Date(endDate), tenantId);
    }
    async getAttendanceSummary(startDate, endDate, req, employeeId) {
        const targetEmployeeId = employeeId || req.user.userId;
        const tenantId = req.user.tenantId;
        return this.attendanceService.getAttendanceSummary(targetEmployeeId, new Date(startDate), new Date(endDate), tenantId);
    }
    async getTeamAttendance(req, date) {
        const tenantId = req.user.tenantId;
        const targetDate = date ? new Date(date) : new Date();
        return this.attendanceService.getTeamAttendance(targetDate, tenantId);
    }
    async getDailyAttendance(req, date) {
        const tenantId = req.user.tenantId;
        const targetDate = date ? new Date(date) : new Date();
        return this.attendanceService.getDailyAttendance(targetDate, tenantId);
    }
    async getAttendanceSummaryForAllEmployees(startDate, endDate, req) {
        const tenantId = req.user.tenantId;
        return this.attendanceService.getAllEmployeesSummary(new Date(startDate), new Date(endDate), tenantId);
    }
    async requestAdjustment(body, req) {
        const employeeId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.attendanceService.requestAdjustment(employeeId, body, tenantId);
    }
    async getAdjustments(req, status, employeeId) {
        const tenantId = req.user.tenantId;
        return this.attendanceService.listAdjustments(tenantId, status, employeeId);
    }
    async approveAdjustment(id, body, req) {
        const approvedById = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.attendanceService.approveAdjustment(id, approvedById, tenantId, body.approved, body.rejectionReason);
    }
    async getAttendanceLogs(startDate, endDate, req, employeeId) {
        const tenantId = req.user.tenantId;
        return this.attendanceService.listAttendanceLogs(tenantId, new Date(startDate), new Date(endDate), employeeId);
    }
    async getPolicies(req) {
        return this.attendanceService.listPolicies(req.user.tenantId);
    }
    async createPolicy(policyData, req) {
        return this.attendanceService.createPolicy(req.user.tenantId, policyData);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, swagger_1.ApiOperation)({ summary: 'Check in employee (self-service)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Check-in successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Already checked in or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('hr/check-in'),
    (0, swagger_1.ApiOperation)({ summary: 'HR manually checks in employee' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Check-in successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Already checked in or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "hrCheckIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    (0, swagger_1.ApiOperation)({ summary: 'Check out employee (self-service)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Check-out successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'No check-in found or already checked out' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Post)('hr/check-out'),
    (0, swagger_1.ApiOperation)({ summary: 'HR manually checks out employee' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Check-out successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'No check-in found or already checked out' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "hrCheckOut", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, swagger_1.ApiOperation)({ summary: 'Get today\'s attendance for current employee' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Today\'s attendance retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No attendance record found' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getTodayAttendance", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance history for employee' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'employeeId', required: false, description: 'Employee ID (optional, defaults to current user)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendance history retrieved' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceHistory", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance summary for employee' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'employeeId', required: false, description: 'Employee ID (optional, defaults to current user)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendance summary retrieved' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceSummary", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, swagger_1.ApiOperation)({ summary: 'Get team attendance (for managers)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Date (YYYY-MM-DD), defaults to today' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team attendance retrieved' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getTeamAttendance", null);
__decorate([
    (0, common_1.Get)('hr/daily'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employees attendance for a specific date (HR only)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Date (YYYY-MM-DD), defaults to today' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily attendance retrieved' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getDailyAttendance", null);
__decorate([
    (0, common_1.Get)('hr/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance summary for all employees (HR only)' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendance summary retrieved' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceSummaryForAllEmployees", null);
__decorate([
    (0, common_1.Post)('adjustments'),
    (0, swagger_1.ApiOperation)({ summary: 'Request attendance adjustment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Adjustment request created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Attendance record not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "requestAdjustment", null);
__decorate([
    (0, common_1.Get)('adjustments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get adjustment requests' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'employeeId', required: false, description: 'Filter by employee' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Adjustment requests retrieved' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAdjustments", null);
__decorate([
    (0, common_1.Put)('adjustments/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject adjustment request' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Adjustment request ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Adjustment processed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Adjustment request not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Adjustment already processed' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "approveAdjustment", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance logs' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'employeeId', required: false, description: 'Filter by employee' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendance logs retrieved' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceLogs", null);
__decorate([
    (0, common_1.Get)('policies'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance policies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Policies retrieved' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getPolicies", null);
__decorate([
    (0, common_1.Post)('policies'),
    (0, swagger_1.ApiOperation)({ summary: 'Create attendance policy' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Policy created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "createPolicy", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map
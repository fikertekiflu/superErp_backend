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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceAdjustment = exports.AdjustmentStatus = exports.AdjustmentType = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../../tenants/tenant.entity");
const employee_entity_1 = require("../../hrm/entities/employee.entity");
const attendance_entity_1 = require("./attendance.entity");
var AdjustmentType;
(function (AdjustmentType) {
    AdjustmentType["CHECK_IN_ADJUSTMENT"] = "check_in_adjustment";
    AdjustmentType["CHECK_OUT_ADJUSTMENT"] = "check_out_adjustment";
    AdjustmentType["STATUS_CHANGE"] = "status_change";
    AdjustmentType["OVERTIME_ADJUSTMENT"] = "overtime_adjustment";
    AdjustmentType["MANUAL_ADDITION"] = "manual_addition";
    AdjustmentType["CORRECTION"] = "correction";
})(AdjustmentType || (exports.AdjustmentType = AdjustmentType = {}));
var AdjustmentStatus;
(function (AdjustmentStatus) {
    AdjustmentStatus["PENDING"] = "pending";
    AdjustmentStatus["APPROVED"] = "approved";
    AdjustmentStatus["REJECTED"] = "rejected";
})(AdjustmentStatus || (exports.AdjustmentStatus = AdjustmentStatus = {}));
let AttendanceAdjustment = class AttendanceAdjustment {
    id;
    attendanceId;
    attendance;
    employeeId;
    employee;
    adjustmentType;
    reason;
    description;
    originalCheckIn;
    newCheckIn;
    originalCheckOut;
    newCheckOut;
    originalTotalHours;
    newTotalHours;
    originalOvertimeHours;
    newOvertimeHours;
    originalStatus;
    newStatus;
    status;
    requestedById;
    approvedById;
    approvedAt;
    rejectionReason;
    supportingDocuments;
    tenantId;
    tenant;
    createdAt;
    updatedAt;
};
exports.AttendanceAdjustment = AttendanceAdjustment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "attendanceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => attendance_entity_1.Attendance),
    __metadata("design:type", attendance_entity_1.Attendance)
], AttendanceAdjustment.prototype, "attendance", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee),
    __metadata("design:type", employee_entity_1.Employee)
], AttendanceAdjustment.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AdjustmentType
    }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "adjustmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendanceAdjustment.prototype, "originalCheckIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendanceAdjustment.prototype, "newCheckIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendanceAdjustment.prototype, "originalCheckOut", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendanceAdjustment.prototype, "newCheckOut", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AttendanceAdjustment.prototype, "originalTotalHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AttendanceAdjustment.prototype, "newTotalHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AttendanceAdjustment.prototype, "originalOvertimeHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AttendanceAdjustment.prototype, "newOvertimeHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "originalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "newStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AdjustmentStatus,
        default: AdjustmentStatus.PENDING
    }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "requestedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "approvedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AttendanceAdjustment.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], AttendanceAdjustment.prototype, "supportingDocuments", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AttendanceAdjustment.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    __metadata("design:type", tenant_entity_1.Tenant)
], AttendanceAdjustment.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceAdjustment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceAdjustment.prototype, "updatedAt", void 0);
exports.AttendanceAdjustment = AttendanceAdjustment = __decorate([
    (0, typeorm_1.Entity)('attendance_adjustments')
], AttendanceAdjustment);
//# sourceMappingURL=attendance-adjustment.entity.js.map
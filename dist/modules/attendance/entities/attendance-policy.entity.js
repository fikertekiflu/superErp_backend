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
exports.AttendancePolicy = exports.GracePeriodType = exports.PolicyType = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../../tenants/tenant.entity");
var PolicyType;
(function (PolicyType) {
    PolicyType["REGULAR"] = "regular";
    PolicyType["FLEXIBLE"] = "flexible";
    PolicyType["SHIFT"] = "shift";
    PolicyType["REMOTE"] = "remote";
})(PolicyType || (exports.PolicyType = PolicyType = {}));
var GracePeriodType;
(function (GracePeriodType) {
    GracePeriodType["MINUTES"] = "minutes";
    GracePeriodType["PERCENTAGE"] = "percentage";
})(GracePeriodType || (exports.GracePeriodType = GracePeriodType = {}));
let AttendancePolicy = class AttendancePolicy {
    id;
    name;
    description;
    policyType;
    standardCheckIn;
    standardCheckOut;
    lunchStart;
    lunchEnd;
    requiredWorkHours;
    gracePeriodMinutes;
    gracePeriodType;
    lateThresholdMinutes;
    halfDayThresholdMinutes;
    absentThresholdMinutes;
    overtimeRate;
    weekendOvertimeRate;
    holidayOvertimeRate;
    workingDays;
    shiftSettings;
    flexibleSettings;
    remoteSettings;
    isAutoApprovalEnabled;
    requireLocationCheck;
    allowedLocations;
    isActive;
    effectiveFrom;
    effectiveTo;
    tenantId;
    tenant;
    createdAt;
    updatedAt;
};
exports.AttendancePolicy = AttendancePolicy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PolicyType,
        default: PolicyType.REGULAR
    }),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "policyType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "standardCheckIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "standardCheckOut", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "lunchStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "lunchEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 8 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "requiredWorkHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "gracePeriodMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: GracePeriodType,
        default: GracePeriodType.MINUTES
    }),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "gracePeriodType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 15 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "lateThresholdMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 30 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "halfDayThresholdMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 240 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "absentThresholdMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "overtimeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "weekendOvertimeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], AttendancePolicy.prototype, "holidayOvertimeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AttendancePolicy.prototype, "workingDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AttendancePolicy.prototype, "shiftSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AttendancePolicy.prototype, "flexibleSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AttendancePolicy.prototype, "remoteSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AttendancePolicy.prototype, "isAutoApprovalEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], AttendancePolicy.prototype, "requireLocationCheck", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], AttendancePolicy.prototype, "allowedLocations", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AttendancePolicy.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "effectiveFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "effectiveTo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    __metadata("design:type", tenant_entity_1.Tenant)
], AttendancePolicy.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "updatedAt", void 0);
exports.AttendancePolicy = AttendancePolicy = __decorate([
    (0, typeorm_1.Entity)('attendance_policies')
], AttendancePolicy);
//# sourceMappingURL=attendance-policy.entity.js.map
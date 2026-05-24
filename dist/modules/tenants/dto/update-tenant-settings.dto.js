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
exports.UpdateTenantSettingsDto = exports.TenantNotificationSettingsDto = exports.TenantRegionalSettingsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TenantRegionalSettingsDto {
    timezone;
    currency;
    dateFormat;
    language;
    weekStartsOn;
}
exports.TenantRegionalSettingsDto = TenantRegionalSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TenantRegionalSettingsDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TenantRegionalSettingsDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TenantRegionalSettingsDto.prototype, "dateFormat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TenantRegionalSettingsDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TenantRegionalSettingsDto.prototype, "weekStartsOn", void 0);
class TenantNotificationSettingsDto {
    workflowEmails;
    taskAssignmentEmails;
    approvalRequestEmails;
    weeklyDigest;
}
exports.TenantNotificationSettingsDto = TenantNotificationSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TenantNotificationSettingsDto.prototype, "workflowEmails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TenantNotificationSettingsDto.prototype, "taskAssignmentEmails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TenantNotificationSettingsDto.prototype, "approvalRequestEmails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TenantNotificationSettingsDto.prototype, "weeklyDigest", void 0);
class UpdateTenantSettingsDto {
    name;
    description;
    industry;
    companySize;
    regional;
    notifications;
}
exports.UpdateTenantSettingsDto = UpdateTenantSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantSettingsDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantSettingsDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantSettingsDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantSettingsDto.prototype, "companySize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TenantRegionalSettingsDto),
    __metadata("design:type", TenantRegionalSettingsDto)
], UpdateTenantSettingsDto.prototype, "regional", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TenantNotificationSettingsDto),
    __metadata("design:type", TenantNotificationSettingsDto)
], UpdateTenantSettingsDto.prototype, "notifications", void 0);
//# sourceMappingURL=update-tenant-settings.dto.js.map
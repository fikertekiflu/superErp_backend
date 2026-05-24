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
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_admin_guard_1 = require("../auth/guards/tenant-admin.guard");
const email_service_1 = require("./email.service");
let EmailController = class EmailController {
    emailService;
    constructor(emailService) {
        this.emailService = emailService;
    }
    getStatus() {
        return this.emailService.getPublicStatus();
    }
    async sendTest(req, body) {
        const to = body.to?.trim() || req.user.email;
        if (!to) {
            return {
                ok: false,
                message: 'No recipient — pass { "to": "you@company.com" } or ensure your user has an email',
            };
        }
        const result = await this.emailService.sendTestEmail(to);
        return {
            ok: result.sent,
            to,
            messageId: result.messageId,
            error: result.error,
            skippedReason: result.skippedReason,
            provider: this.emailService.getProvider(),
            hint: result.sent
                ? 'Check inbox and spam. For Resend production, verify your domain and use RESEND_FROM=you@yourdomain.com'
                : this.emailService.getPublicStatus().setupHint,
        };
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Email provider status (tenant admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmailController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a test email (tenant admin)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendTest", null);
exports.EmailController = EmailController = __decorate([
    (0, swagger_1.ApiTags)('Email'),
    (0, common_1.Controller)('email'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_admin_guard_1.TenantAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map
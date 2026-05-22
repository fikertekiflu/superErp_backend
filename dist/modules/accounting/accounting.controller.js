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
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const accounting_service_1 = require("./accounting.service");
const accounting_dto_1 = require("./dto/accounting.dto");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
let AccountingController = class AccountingController {
    accountingService;
    subscriptionsService;
    constructor(accountingService, subscriptionsService) {
        this.accountingService = accountingService;
        this.subscriptionsService = subscriptionsService;
    }
    async checkAccountingAccess(tenantId) {
        const subscription = await this.subscriptionsService.findTenantSubscription(tenantId);
        if (!subscription || !subscription.plan || !subscription.plan.modules.includes('accounting')) {
            throw new Error('Accounting module is not available on your current plan. Please upgrade to Enterprise.');
        }
    }
    async seedAccounts(req) {
        const tenantId = req.user.tenantId;
        await this.checkAccountingAccess(tenantId);
        await this.accountingService.seedDefaultAccounts(tenantId);
        return { message: 'Default accounts seeded successfully' };
    }
    async createAccount(req, dto) {
        const tenantId = req.user.tenantId;
        await this.checkAccountingAccess(tenantId);
        return this.accountingService.createAccount(tenantId, dto);
    }
    async getAccounts(req) {
        const tenantId = req.user.tenantId;
        await this.checkAccountingAccess(tenantId);
        return this.accountingService.getAccounts(tenantId);
    }
    async createJournalEntry(req, dto) {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        await this.checkAccountingAccess(tenantId);
        return this.accountingService.createJournalEntry(tenantId, userId, dto);
    }
    async getJournalEntries(req) {
        const tenantId = req.user.tenantId;
        await this.checkAccountingAccess(tenantId);
        return this.accountingService.getJournalEntries(tenantId);
    }
    async getTrialBalance(req) {
        const tenantId = req.user.tenantId;
        await this.checkAccountingAccess(tenantId);
        return this.accountingService.getTrialBalance(tenantId);
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Post)('accounts/seed'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed default chart of accounts' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "seedAccounts", null);
__decorate([
    (0, common_1.Post)('accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new ledger account' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, accounting_dto_1.CreateAccountDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chart of accounts' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Post)('journal'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a journal entry' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, accounting_dto_1.CreateJournalEntryDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "createJournalEntry", null);
__decorate([
    (0, common_1.Get)('journal'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all journal entries' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getJournalEntries", null);
__decorate([
    (0, common_1.Get)('reports/trial-balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trial balance report' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getTrialBalance", null);
exports.AccountingController = AccountingController = __decorate([
    (0, swagger_1.ApiTags)('accounting'),
    (0, common_1.Controller)('accounting'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService,
        subscriptions_service_1.SubscriptionsService])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map
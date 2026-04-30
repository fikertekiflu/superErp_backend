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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const subscriptions_service_1 = require("./subscriptions.service");
const chapa_service_1 = require("./chapa.service");
let SubscriptionsController = class SubscriptionsController {
    subscriptionsService;
    chapaService;
    constructor(subscriptionsService, chapaService) {
        this.subscriptionsService = subscriptionsService;
        this.chapaService = chapaService;
    }
    async getPlans() {
        return this.subscriptionsService.findAllPlans();
    }
    async getMySubscription(req) {
        const tenantId = req.user.tenantId;
        return this.subscriptionsService.findTenantSubscription(tenantId);
    }
    async upgrade(planId, req) {
        const tenantId = req.user.tenantId;
        return this.subscriptionsService.upgradePlan(tenantId, planId);
    }
    async findAllSubscriptions() {
        return this.subscriptionsService.findAllSubscriptions();
    }
    async findAllPlans() {
        return this.subscriptionsService.findAllPlans();
    }
    async updatePlan(id, data) {
        return this.subscriptionsService.updatePlan(id, data);
    }
    async checkout(planId, req) {
        const tenantId = req.user.tenantId;
        const user = req.user;
        const plan = await this.subscriptionsService.findPlanById(planId);
        const tx_ref = `tx-${tenantId.split('-')[0]}-${planId.split('-')[0]}-${Date.now()}`;
        const payload = {
            amount: plan.price,
            currency: 'ETB',
            email: user.email,
            first_name: user.firstName || 'User',
            last_name: user.lastName || 'ERP',
            tx_ref,
            meta: {
                planId: planId,
                tenantId: tenantId
            },
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/billing/success?status=success&tx_ref=${tx_ref}`,
            callback_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/subscriptions/webhook/chapa`,
        };
        console.log('Sending to Chapa:', JSON.stringify(payload, null, 2));
        return this.chapaService.initializeTransaction(payload);
    }
    async verify(tx_ref, req) {
        const tenantId = req.user.tenantId;
        const verification = await this.chapaService.verifyTransaction(tx_ref);
        if (verification.status === 'success') {
            const parts = tx_ref.split('-');
            const planPart = parts[2];
            console.log('Verifying payment for tx_ref:', tx_ref);
            console.log('Extracted Plan Part:', planPart);
            const allPlans = await this.subscriptionsService.findAllPlans();
            const plan = allPlans.find(p => p.id.startsWith(planPart));
            if (plan) {
                console.log('Found matching plan:', plan.name, 'with ID:', plan.id);
                await this.subscriptionsService.upgradePlan(tenantId, plan.id);
                console.log('Successfully upgraded tenant:', tenantId, 'to plan:', plan.name);
                return { status: 'success', message: 'Payment verified and plan upgraded' };
            }
            else {
                console.log('CRITICAL: No plan found starting with:', planPart);
                console.log('Available plan IDs:', allPlans.map(p => p.id));
                return { status: 'failed', message: 'Plan matching failed' };
            }
        }
        return { status: 'failed', message: 'Payment verification failed' };
    }
    async createPlan(planData) {
        return this.subscriptionsService.createPlan(planData);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active subscription plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('my-subscription'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current tenant subscription' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.Post)('upgrade/:planId'),
    (0, swagger_1.ApiOperation)({ summary: 'Upgrade or change subscription plan' }),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "upgrade", null);
__decorate([
    (0, common_1.Get)('admin-all'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tenant subscriptions (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "findAllSubscriptions", null);
__decorate([
    (0, common_1.Get)('admin-plans'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all plans (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "findAllPlans", null);
__decorate([
    (0, common_1.Patch)('admin-plans/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a subscription plan (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Post)('checkout/:planId'),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize Chapa payment for a plan' }),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('verify/:tx_ref'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Chapa payment' }),
    __param(0, (0, common_1.Param)('tx_ref')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('admin/plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new plan (Admin only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createPlan", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('subscriptions'),
    (0, common_1.Controller)('subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService,
        chapa_service_1.ChapaService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map
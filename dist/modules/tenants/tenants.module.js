"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tenants_controller_1 = require("./tenants.controller");
const tenants_service_1 = require("./tenants.service");
const tenant_verification_storage_service_1 = require("./tenant-verification-storage.service");
const tenant_entity_1 = require("./tenant.entity");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const audit_logs_module_1 = require("../audit-logs/audit-logs.module");
const entities_module_1 = require("../entities/entities.module");
const workflows_module_1 = require("../workflows/workflows.module");
let TenantsModule = class TenantsModule {
};
exports.TenantsModule = TenantsModule;
exports.TenantsModule = TenantsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([tenant_entity_1.Tenant]),
            subscriptions_module_1.SubscriptionsModule,
            audit_logs_module_1.AuditLogsModule,
            entities_module_1.EntitiesModule,
            workflows_module_1.WorkflowsModule,
        ],
        controllers: [tenants_controller_1.TenantsController],
        providers: [tenants_service_1.TenantsService, tenant_verification_storage_service_1.TenantVerificationStorageService],
        exports: [tenants_service_1.TenantsService],
    })
], TenantsModule);
//# sourceMappingURL=tenants.module.js.map
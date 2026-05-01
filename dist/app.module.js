"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const database_config_1 = require("./config/database.config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_test_service_1 = require("./database-test.service");
const auth_module_1 = require("./modules/auth/auth.module");
const user_entity_1 = require("./modules/users/user.entity");
const tenant_entity_1 = require("./modules/tenants/tenant.entity");
const role_entity_1 = require("./modules/roles/role.entity");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const entities_module_1 = require("./modules/entities/entities.module");
const workflows_module_1 = require("./modules/workflows/workflows.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const hrm_module_1 = require("./modules/hrm/hrm.module");
const invoices_module_1 = require("./modules/invoices/invoices.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: database_config_1.getDatabaseConfig,
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, tenant_entity_1.Tenant, role_entity_1.Role]),
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            entities_module_1.EntitiesModule,
            workflows_module_1.WorkflowsModule,
            subscriptions_module_1.SubscriptionsModule,
            hrm_module_1.HrmModule,
            invoices_module_1.InvoicesModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, database_test_service_1.DatabaseTestService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
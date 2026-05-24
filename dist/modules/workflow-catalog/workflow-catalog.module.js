"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowCatalogModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const published_workflow_template_entity_1 = require("./published-workflow-template.entity");
const workflow_catalog_service_1 = require("./workflow-catalog.service");
const workflow_catalog_controller_1 = require("./workflow-catalog.controller");
const tenant_entity_1 = require("../tenants/tenant.entity");
const platform_catalog_controller_1 = require("./platform-catalog.controller");
const platform_catalog_service_1 = require("./platform-catalog.service");
let WorkflowCatalogModule = class WorkflowCatalogModule {
};
exports.WorkflowCatalogModule = WorkflowCatalogModule;
exports.WorkflowCatalogModule = WorkflowCatalogModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([published_workflow_template_entity_1.PublishedWorkflowTemplate, tenant_entity_1.Tenant]),
        ],
        controllers: [
            workflow_catalog_controller_1.WorkflowCatalogController,
            workflow_catalog_controller_1.AdminWorkflowCatalogController,
            platform_catalog_controller_1.PlatformCatalogController,
        ],
        providers: [workflow_catalog_service_1.WorkflowCatalogService, platform_catalog_service_1.PlatformCatalogService],
        exports: [workflow_catalog_service_1.WorkflowCatalogService, platform_catalog_service_1.PlatformCatalogService],
    })
], WorkflowCatalogModule);
//# sourceMappingURL=workflow-catalog.module.js.map
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
const tenant_entity_1 = require("./tenant.entity");
const entities_service_1 = require("../entities/entities.service");
const workflows_service_1 = require("../workflows/workflows.service");
const entity_entity_1 = require("../entities/entity.entity");
const entity_data_entity_1 = require("../entities/entity-data.entity");
const workflow_entity_1 = require("../workflows/workflow.entity");
const workflow_step_entity_1 = require("../workflows/workflow-step.entity");
const workflow_state_entity_1 = require("../workflows/workflow-state.entity");
const workflow_transition_entity_1 = require("../workflows/workflow-transition.entity");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
let TenantsModule = class TenantsModule {
};
exports.TenantsModule = TenantsModule;
exports.TenantsModule = TenantsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                tenant_entity_1.Tenant,
                entity_entity_1.Entity,
                entity_data_entity_1.EntityData,
                workflow_entity_1.Workflow,
                workflow_step_entity_1.WorkflowStep,
                workflow_state_entity_1.WorkflowState,
                workflow_transition_entity_1.WorkflowTransition,
            ]),
            subscriptions_module_1.SubscriptionsModule,
        ],
        controllers: [tenants_controller_1.TenantsController],
        providers: [tenants_service_1.TenantsService, entities_service_1.EntitiesService, workflows_service_1.WorkflowsService],
        exports: [tenants_service_1.TenantsService],
    })
], TenantsModule);
//# sourceMappingURL=tenants.module.js.map
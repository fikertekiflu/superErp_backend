"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsModule = void 0;
const common_1 = require("@nestjs/common");
const entities_module_1 = require("../entities/entities.module");
const typeorm_1 = require("@nestjs/typeorm");
const workflows_controller_1 = require("./workflows.controller");
const workflow_executions_controller_1 = require("./workflow-executions.controller");
const workflows_service_1 = require("./workflows.service");
const workflow_execution_service_1 = require("./workflow-execution.service");
const workflow_entity_1 = require("./workflow.entity");
const workflow_state_entity_1 = require("./workflow-state.entity");
const workflow_transition_entity_1 = require("./workflow-transition.entity");
const workflow_event_entity_1 = require("./workflow-event.entity");
const workflow_execution_entity_1 = require("./workflow-execution.entity");
const workflow_step_entity_1 = require("./workflow-step.entity");
const conditional_logic_service_1 = require("./conditional-logic.service");
const entity_entity_1 = require("../entities/entity.entity");
const task_entity_1 = require("../tasks/task.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const user_entity_1 = require("../users/user.entity");
const tenant_entity_1 = require("../tenants/tenant.entity");
const employee_entity_1 = require("../hrm/entities/employee.entity");
const department_entity_1 = require("../hrm/entities/department.entity");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const role_entity_1 = require("../roles/role.entity");
const entity_data_entity_1 = require("../entities/entity-data.entity");
const workflow_automation_service_1 = require("./workflow-automation.service");
const workflow_trigger_service_1 = require("./workflow-trigger.service");
const workflow_analytics_service_1 = require("./workflow-analytics.service");
const workflow_delegations_service_1 = require("./workflow-delegations.service");
const workflow_approval_limits_service_1 = require("./workflow-approval-limits.service");
const workflow_delegation_entity_1 = require("./workflow-delegation.entity");
const workflow_delegations_controller_1 = require("./workflow-delegations.controller");
let WorkflowsModule = class WorkflowsModule {
};
exports.WorkflowsModule = WorkflowsModule;
exports.WorkflowsModule = WorkflowsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                workflow_entity_1.Workflow,
                workflow_step_entity_1.WorkflowStep,
                workflow_execution_entity_1.WorkflowExecution,
                workflow_event_entity_1.WorkflowEvent,
                workflow_state_entity_1.WorkflowState,
                workflow_transition_entity_1.WorkflowTransition,
                workflow_delegation_entity_1.WorkflowDelegation,
                entity_entity_1.Entity,
                entity_data_entity_1.EntityData,
                task_entity_1.Task,
                notification_entity_1.Notification,
                user_entity_1.User,
                tenant_entity_1.Tenant,
                employee_entity_1.Employee,
                department_entity_1.Department,
                role_entity_1.Role,
            ]),
            subscriptions_module_1.SubscriptionsModule,
            (0, common_1.forwardRef)(() => entities_module_1.EntitiesModule),
        ],
        controllers: [
            workflows_controller_1.WorkflowsController,
            workflow_executions_controller_1.WorkflowExecutionsController,
            workflow_delegations_controller_1.WorkflowDelegationsController,
        ],
        providers: [
            workflows_service_1.WorkflowsService,
            workflow_execution_service_1.WorkflowExecutionService,
            conditional_logic_service_1.ConditionalLogicService,
            workflow_automation_service_1.WorkflowAutomationService,
            workflow_trigger_service_1.WorkflowTriggerService,
            workflow_analytics_service_1.WorkflowAnalyticsService,
            workflow_delegations_service_1.WorkflowDelegationsService,
            workflow_approval_limits_service_1.WorkflowApprovalLimitsService,
        ],
        exports: [
            workflows_service_1.WorkflowsService,
            workflow_execution_service_1.WorkflowExecutionService,
            workflow_trigger_service_1.WorkflowTriggerService,
            workflow_delegations_service_1.WorkflowDelegationsService,
            workflow_approval_limits_service_1.WorkflowApprovalLimitsService,
        ],
    })
], WorkflowsModule);
//# sourceMappingURL=workflows.module.js.map
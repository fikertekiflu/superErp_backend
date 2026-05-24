"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksModule = void 0;
const common_1 = require("@nestjs/common");
const workflows_module_1 = require("../workflows/workflows.module");
const typeorm_1 = require("@nestjs/typeorm");
const task_entity_1 = require("./task.entity");
const tasks_controller_1 = require("./tasks.controller");
const tasks_service_1 = require("./tasks.service");
const workflow_execution_entity_1 = require("../workflows/workflow-execution.entity");
const workflow_step_entity_1 = require("../workflows/workflow-step.entity");
const workflow_entity_1 = require("../workflows/workflow.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const user_entity_1 = require("../users/user.entity");
const role_entity_1 = require("../roles/role.entity");
const entity_entity_1 = require("../entities/entity.entity");
const entity_data_entity_1 = require("../entities/entity-data.entity");
let TasksModule = class TasksModule {
};
exports.TasksModule = TasksModule;
exports.TasksModule = TasksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => workflows_module_1.WorkflowsModule),
            typeorm_1.TypeOrmModule.forFeature([
                task_entity_1.Task,
                workflow_execution_entity_1.WorkflowExecution,
                workflow_step_entity_1.WorkflowStep,
                workflow_entity_1.Workflow,
                notification_entity_1.Notification,
                user_entity_1.User,
                role_entity_1.Role,
                entity_entity_1.Entity,
                entity_data_entity_1.EntityData,
            ]),
        ],
        controllers: [tasks_controller_1.TasksController],
        providers: [tasks_service_1.TasksService],
        exports: [tasks_service_1.TasksService],
    })
], TasksModule);
//# sourceMappingURL=tasks.module.js.map
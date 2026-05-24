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
var WorkflowTriggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowTriggerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_entity_1 = require("./workflow.entity");
const workflow_execution_service_1 = require("./workflow-execution.service");
const entity_entity_1 = require("../entities/entity.entity");
let WorkflowTriggerService = WorkflowTriggerService_1 = class WorkflowTriggerService {
    workflowsRepository;
    entityRepository;
    workflowExecutionService;
    logger = new common_1.Logger(WorkflowTriggerService_1.name);
    constructor(workflowsRepository, entityRepository, workflowExecutionService) {
        this.workflowsRepository = workflowsRepository;
        this.entityRepository = entityRepository;
        this.workflowExecutionService = workflowExecutionService;
    }
    async triggerForEntityRecord(tenantId, entityDefinitionId, entityName, recordId, data, userId) {
        if (!tenantId) {
            this.logger.warn('triggerForEntityRecord skipped: missing tenantId');
            return;
        }
        const workflows = await this.workflowsRepository.find({
            where: {
                tenantId,
                status: 'active',
                trigger: 'event_based',
            },
        });
        this.logger.log(`Entity record created (${entityName}/${recordId}): ${workflows.length} active event workflow(s) for tenant`);
        let triggered = 0;
        for (const workflow of workflows) {
            const assignments = workflow.entityAssignments || [];
            const isLinked = assignments.some((a) => a.entityId === entityDefinitionId);
            if (!isLinked) {
                continue;
            }
            this.logger.log(`Triggering workflow "${workflow.name}" (${workflow.id}) for ${entityName}`);
            try {
                await this.workflowExecutionService.triggerWorkflow(workflow.id, userId, tenantId, {
                    recordId,
                    entityDefinitionId,
                    entityId: recordId,
                    entityType: entityName,
                    entityData: data,
                    triggerType: 'event_based',
                });
                triggered++;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.error(`Workflow "${workflow.name}" failed to run: ${message}`);
            }
        }
        if (triggered === 0) {
            this.logger.warn(`No workflow ran for entity ${entityDefinitionId}. Check workflow is Active, trigger=event_based, and entity is assigned.`);
        }
    }
    async triggerForEntitySlugs(tenantId, slugs, recordId, data, userId) {
        for (const slug of slugs) {
            const entity = await this.entityRepository.findOne({
                where: { slug, tenantId },
            });
            if (entity) {
                await this.triggerForEntityRecord(tenantId, entity.id, entity.name, recordId, data, userId);
                return;
            }
        }
        this.logger.warn(`No entity found for slug(s) [${slugs.join(', ')}] — workflows not triggered`);
    }
};
exports.WorkflowTriggerService = WorkflowTriggerService;
exports.WorkflowTriggerService = WorkflowTriggerService = WorkflowTriggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __param(1, (0, typeorm_1.InjectRepository)(entity_entity_1.Entity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        workflow_execution_service_1.WorkflowExecutionService])
], WorkflowTriggerService);
//# sourceMappingURL=workflow-trigger.service.js.map
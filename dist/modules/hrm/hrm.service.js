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
exports.HrmService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const core_1 = require("@nestjs/core");
const employee_entity_1 = require("./entities/employee.entity");
const department_entity_1 = require("./entities/department.entity");
const position_entity_1 = require("./entities/position.entity");
const workflow_execution_service_1 = require("../workflows/workflow-execution.service");
let HrmService = class HrmService {
    employeeRepository;
    departmentRepository;
    positionRepository;
    moduleRef;
    constructor(employeeRepository, departmentRepository, positionRepository, moduleRef) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.moduleRef = moduleRef;
    }
    async findAll(tenantId) {
        return this.employeeRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }
    async findAllDepartments(tenantId) {
        return this.departmentRepository.find({ where: { tenantId } });
    }
    async createDepartment(tenantId, data) {
        const dept = this.departmentRepository.create({ ...data, tenantId });
        return this.departmentRepository.save(dept);
    }
    async removeDepartment(id, tenantId) {
        await this.departmentRepository.delete({ id, tenantId });
    }
    async findAllPositions(tenantId) {
        return this.positionRepository.find({ where: { tenantId } });
    }
    async createPosition(tenantId, data) {
        const pos = this.positionRepository.create({ ...data, tenantId });
        return this.positionRepository.save(pos);
    }
    async removePosition(id, tenantId) {
        await this.positionRepository.delete({ id, tenantId });
    }
    async findOne(id, tenantId) {
        const employee = await this.employeeRepository.findOne({
            where: { id, tenantId },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return employee;
    }
    async create(tenantId, data, createdBy) {
        const employee = this.employeeRepository.create({
            ...data,
            tenantId,
        });
        const saved = await this.employeeRepository.save(employee);
        try {
            const workflowService = this.moduleRef.get(workflow_execution_service_1.WorkflowExecutionService, { strict: false });
            await workflowService.triggerWorkflow('employee-onboarding', createdBy || 'system', tenantId, {
                entityId: saved.id,
                entityType: 'Employee',
                entityData: saved,
                triggerType: 'event_based',
            });
            console.log(`🔥 Employee onboarding workflow triggered for ${saved.firstName} ${saved.lastName}`);
        }
        catch (error) {
            console.warn('Failed to trigger employee onboarding workflow:', error);
        }
        return saved;
    }
    async update(id, tenantId, data) {
        await this.findOne(id, tenantId);
        await this.employeeRepository.update(id, data);
        return this.findOne(id, tenantId);
    }
    async remove(id, tenantId) {
        const employee = await this.findOne(id, tenantId);
        await this.employeeRepository.remove(employee);
    }
};
exports.HrmService = HrmService;
exports.HrmService = HrmService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(1, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(2, (0, typeorm_1.InjectRepository)(position_entity_1.Position)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        core_1.ModuleRef])
], HrmService);
//# sourceMappingURL=hrm.service.js.map
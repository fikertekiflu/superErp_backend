import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Department } from './entities/department.entity';
import { Position } from './entities/position.entity';
import { WorkflowTriggerService } from '../workflows/workflow-trigger.service';
export declare class HrmService {
    private employeeRepository;
    private departmentRepository;
    private positionRepository;
    private workflowTriggerService;
    constructor(employeeRepository: Repository<Employee>, departmentRepository: Repository<Department>, positionRepository: Repository<Position>, workflowTriggerService: WorkflowTriggerService);
    findAll(tenantId: string): Promise<Employee[]>;
    findAllDepartments(tenantId: string): Promise<Department[]>;
    createDepartment(tenantId: string, data: Partial<Department>): Promise<Department>;
    removeDepartment(id: string, tenantId: string): Promise<void>;
    findAllPositions(tenantId: string): Promise<Position[]>;
    createPosition(tenantId: string, data: Partial<Position>): Promise<Position>;
    removePosition(id: string, tenantId: string): Promise<void>;
    findOne(id: string, tenantId: string): Promise<Employee>;
    create(tenantId: string, data: Partial<Employee>, createdBy?: string): Promise<Employee>;
    update(id: string, tenantId: string, data: Partial<Employee>): Promise<Employee>;
    remove(id: string, tenantId: string): Promise<void>;
}

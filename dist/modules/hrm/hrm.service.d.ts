import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Department } from './entities/department.entity';
import { Position } from './entities/position.entity';
export declare class HrmService {
    private employeeRepository;
    private departmentRepository;
    private positionRepository;
    constructor(employeeRepository: Repository<Employee>, departmentRepository: Repository<Department>, positionRepository: Repository<Position>);
    findAll(tenantId: string): Promise<Employee[]>;
    findAllDepartments(tenantId: string): Promise<Department[]>;
    createDepartment(tenantId: string, data: Partial<Department>): Promise<Department>;
    removeDepartment(id: string, tenantId: string): Promise<void>;
    findAllPositions(tenantId: string): Promise<Position[]>;
    createPosition(tenantId: string, data: Partial<Position>): Promise<Position>;
    removePosition(id: string, tenantId: string): Promise<void>;
    findOne(id: string, tenantId: string): Promise<Employee>;
    create(tenantId: string, data: Partial<Employee>): Promise<Employee>;
    update(id: string, tenantId: string, data: Partial<Employee>): Promise<Employee>;
    remove(id: string, tenantId: string): Promise<void>;
}

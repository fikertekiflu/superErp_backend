import { HrmService } from './hrm.service';
export declare class HrmController {
    private readonly hrmService;
    constructor(hrmService: HrmService);
    findAll(req: any): Promise<import("./entities/employee.entity").Employee[]>;
    findOne(id: string, req: any): Promise<import("./entities/employee.entity").Employee>;
    create(req: any, data: any): Promise<import("./entities/employee.entity").Employee>;
    update(id: string, req: any, data: any): Promise<import("./entities/employee.entity").Employee>;
    remove(id: string, req: any): Promise<void>;
    findAllDepartments(req: any): Promise<import("./entities/department.entity").Department[]>;
    createDepartment(req: any, data: any): Promise<import("./entities/department.entity").Department>;
    removeDepartment(id: string, req: any): Promise<void>;
    findAllPositions(req: any): Promise<import("./entities/position.entity").Position[]>;
    createPosition(req: any, data: any): Promise<import("./entities/position.entity").Position>;
    removePosition(id: string, req: any): Promise<void>;
}

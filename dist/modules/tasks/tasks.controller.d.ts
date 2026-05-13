import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getMyTasks(req: any): Promise<import("./task.entity").Task[]>;
    claimTask(id: string, req: any): Promise<import("./task.entity").Task>;
    unclaimTask(id: string, req: any): Promise<import("./task.entity").Task>;
    getAllTasks(req: any): Promise<import("./task.entity").Task[]>;
    getStats(req: any): Promise<any>;
    getTask(id: string): Promise<import("./task.entity").Task>;
    startTask(id: string, req: any): Promise<import("./task.entity").Task>;
    completeTask(id: string, body: {
        approved?: boolean;
        notes?: string;
        data?: any;
    }, req: any): Promise<import("./task.entity").Task>;
    cancelTask(id: string, req: any): Promise<import("./task.entity").Task>;
}

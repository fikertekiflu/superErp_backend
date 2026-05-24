import { WorkflowDelegationsService } from './workflow-delegations.service';
export declare class WorkflowDelegationsController {
    private readonly delegationsService;
    constructor(delegationsService: WorkflowDelegationsService);
    list(req: any): Promise<{
        granted: import("./workflow-delegation.entity").WorkflowDelegation[];
        received: import("./workflow-delegation.entity").WorkflowDelegation[];
    }>;
    create(req: any, body: {
        delegateUserId: string;
        startsAt: string;
        endsAt: string;
        roleIds?: string[];
        reason?: string;
    }): Promise<import("./workflow-delegation.entity").WorkflowDelegation>;
    revoke(id: string, req: any): Promise<import("./workflow-delegation.entity").WorkflowDelegation>;
}

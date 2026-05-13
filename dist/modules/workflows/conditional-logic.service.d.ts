import { WorkflowExecution } from './workflow-execution.entity';
export interface ConditionalRule {
    id: string;
    type: 'if' | 'else_if' | 'else';
    condition: {
        field: string;
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
        value: any;
    };
    then: {
        stepId?: string;
        action?: 'skip' | 'goto' | 'parallel' | 'stop';
        target?: string;
    };
}
export interface ConditionalStep {
    id: string;
    name: string;
    type: 'conditional';
    config: {
        rules: ConditionalRule[];
        defaultAction?: 'skip' | 'goto' | 'stop';
        defaultTarget?: string;
    };
}
export declare class ConditionalLogicService {
    evaluateCondition(rule: ConditionalRule, execution: WorkflowExecution, stepResult?: any): Promise<boolean>;
    private compareValues;
    processConditionalStep(conditionalStep: ConditionalStep, execution: WorkflowExecution, allSteps: any[], stepResults: any[]): Promise<{
        action: string;
        target?: string;
        nextStepId?: string;
    }>;
    createConditionalStep(config: any): ConditionalStep;
    validateConditionalStep(step: ConditionalStep): {
        valid: boolean;
        errors: string[];
    };
    getAvailableFields(workflow: any): Array<{
        field: string;
        label: string;
        type: string;
    }>;
    getAvailableOperators(fieldType: string): Array<{
        value: string;
        label: string;
    }>;
}

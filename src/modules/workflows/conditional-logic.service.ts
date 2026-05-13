import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ConditionalLogicService {
  
  /**
   * Evaluate conditional rules against execution context
   */
  async evaluateCondition(
    rule: ConditionalRule,
    execution: WorkflowExecution,
    stepResult?: any
  ): Promise<boolean> {
    const { field, operator, value } = rule.condition;
    
    // Get the actual value from execution context or step result
    let actualValue: any;
    
    if (field.startsWith('entity.')) {
      // Field from entity data
      const entityField = field.replace('entity.', '');
      actualValue = execution.context?.entityData?.[entityField];
    } else if (field.startsWith('step.')) {
      // Field from previous step result
      const stepField = field.replace('step.', '');
      actualValue = stepResult?.[stepField];
    } else if (field.startsWith('execution.')) {
      // Field from execution metadata
      const execField = field.replace('execution.', '');
      actualValue = execution[execField as keyof WorkflowExecution];
    } else if (field.startsWith('user.')) {
      // Field from current user (would need user context)
      actualValue = null; // Would need to fetch user data
    } else {
      // Direct field from execution
      actualValue = execution[field as keyof WorkflowExecution];
    }

    return this.compareValues(actualValue, operator, value);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'contains':
        return String(actual).toLowerCase().includes(String(expected).toLowerCase());
      case 'in':
        return Array.isArray(expected) ? expected.includes(actual) : false;
      case 'not_in':
        return Array.isArray(expected) ? !expected.includes(actual) : true;
      default:
        return false;
    }
  }

  /**
   * Process conditional step and determine next action
   */
  async processConditionalStep(
    conditionalStep: ConditionalStep,
    execution: WorkflowExecution,
    allSteps: any[],
    stepResults: any[]
  ): Promise<{
    action: string;
    target?: string;
    nextStepId?: string;
  }> {
    const { rules, defaultAction = 'skip', defaultTarget } = conditionalStep.config;

    // Evaluate each rule in order
    for (const rule of rules) {
      const stepResult = stepResults.find(sr => sr.stepId === rule.then.stepId);
      const conditionMet = await this.evaluateCondition(rule, execution, stepResult);

      if (conditionMet) {
        // Rule condition met, execute the 'then' action
        const { action, target } = rule.then;
        
        if (action === 'goto' && target) {
          // Find the step with the specified name or ID
          const targetStep = allSteps.find(step => 
            step.name === target || step.id === target
          );
          return {
            action: 'goto',
            target,
            nextStepId: targetStep?.id
          };
        } else if (action === 'parallel' && target) {
          // Execute multiple steps in parallel
          return {
            action: 'parallel',
            target
          };
        } else if (action === 'stop') {
          // Stop workflow execution
          return {
            action: 'stop'
          };
        } else if (action === 'skip') {
          // Skip to next step
          return {
            action: 'skip'
          };
        }
      }
    }

    // No rules matched, use default action
    return {
      action: defaultAction,
      target: defaultTarget
    };
  }

  /**
   * Create conditional step from configuration
   */
  createConditionalStep(config: any): ConditionalStep {
    return {
      id: config.id,
      name: config.name,
      type: 'conditional',
      config: {
        rules: config.rules || [],
        defaultAction: config.defaultAction || 'skip',
        defaultTarget: config.defaultTarget
      }
    };
  }

  /**
   * Validate conditional step configuration
   */
  validateConditionalStep(step: ConditionalStep): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!step.config.rules || step.config.rules.length === 0) {
      errors.push('Conditional step must have at least one rule');
    }

    step.config.rules.forEach((rule, index) => {
      if (!rule.condition.field) {
        errors.push(`Rule ${index + 1}: Field is required`);
      }
      if (!rule.condition.operator) {
        errors.push(`Rule ${index + 1}: Operator is required`);
      }
      if (!rule.then.action) {
        errors.push(`Rule ${index + 1}: Action is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available fields for conditional logic
   */
  getAvailableFields(workflow: any): Array<{ field: string; label: string; type: string }> {
    const fields: Array<{ field: string; label: string; type: string }> = [];

    // Entity fields
    if (workflow.entityAssignments && workflow.entityAssignments.length > 0) {
      const entity = workflow.entityAssignments[0].entity;
      if (entity && entity.fields) {
        entity.fields.forEach((field: any) => {
          fields.push({
            field: `entity.${field.name}`,
            label: `Entity: ${field.label || field.name}`,
            type: field.type || 'string'
          });
        });
      }
    }

    // Execution fields
    fields.push(
      { field: 'execution.status', label: 'Execution Status', type: 'string' },
      { field: 'execution.currentState', label: 'Current State', type: 'string' },
      { field: 'execution.startedAt', label: 'Started At', type: 'datetime' }
    );

    // Step result fields (would need to be dynamic based on actual steps)
    fields.push(
      { field: 'step.approved', label: 'Last Step: Approved', type: 'boolean' },
      { field: 'step.completedAt', label: 'Last Step: Completed At', type: 'datetime' },
      { field: 'step.result', label: 'Last Step: Result', type: 'object' }
    );

    return fields;
  }

  /**
   * Get available operators for field type
   */
  getAvailableOperators(fieldType: string): Array<{ value: string; label: string }> {
    const operators = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' }
    ];

    if (fieldType === 'number') {
      operators.push(
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'less_than', label: 'Less Than' }
      );
    }

    if (fieldType === 'array' || fieldType === 'string') {
      operators.push(
        { value: 'in', label: 'In' },
        { value: 'not_in', label: 'Not In' }
      );
    }

    return operators;
  }
}

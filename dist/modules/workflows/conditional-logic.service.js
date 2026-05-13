"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalLogicService = void 0;
const common_1 = require("@nestjs/common");
let ConditionalLogicService = class ConditionalLogicService {
    async evaluateCondition(rule, execution, stepResult) {
        const { field, operator, value } = rule.condition;
        let actualValue;
        if (field.startsWith('entity.')) {
            const entityField = field.replace('entity.', '');
            actualValue = execution.context?.entityData?.[entityField];
        }
        else if (field.startsWith('step.')) {
            const stepField = field.replace('step.', '');
            actualValue = stepResult?.[stepField];
        }
        else if (field.startsWith('execution.')) {
            const execField = field.replace('execution.', '');
            actualValue = execution[execField];
        }
        else if (field.startsWith('user.')) {
            actualValue = null;
        }
        else {
            actualValue = execution[field];
        }
        return this.compareValues(actualValue, operator, value);
    }
    compareValues(actual, operator, expected) {
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
    async processConditionalStep(conditionalStep, execution, allSteps, stepResults) {
        const { rules, defaultAction = 'skip', defaultTarget } = conditionalStep.config;
        for (const rule of rules) {
            const stepResult = stepResults.find(sr => sr.stepId === rule.then.stepId);
            const conditionMet = await this.evaluateCondition(rule, execution, stepResult);
            if (conditionMet) {
                const { action, target } = rule.then;
                if (action === 'goto' && target) {
                    const targetStep = allSteps.find(step => step.name === target || step.id === target);
                    return {
                        action: 'goto',
                        target,
                        nextStepId: targetStep?.id
                    };
                }
                else if (action === 'parallel' && target) {
                    return {
                        action: 'parallel',
                        target
                    };
                }
                else if (action === 'stop') {
                    return {
                        action: 'stop'
                    };
                }
                else if (action === 'skip') {
                    return {
                        action: 'skip'
                    };
                }
            }
        }
        return {
            action: defaultAction,
            target: defaultTarget
        };
    }
    createConditionalStep(config) {
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
    validateConditionalStep(step) {
        const errors = [];
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
    getAvailableFields(workflow) {
        const fields = [];
        if (workflow.entityAssignments && workflow.entityAssignments.length > 0) {
            const entity = workflow.entityAssignments[0].entity;
            if (entity && entity.fields) {
                entity.fields.forEach((field) => {
                    fields.push({
                        field: `entity.${field.name}`,
                        label: `Entity: ${field.label || field.name}`,
                        type: field.type || 'string'
                    });
                });
            }
        }
        fields.push({ field: 'execution.status', label: 'Execution Status', type: 'string' }, { field: 'execution.currentState', label: 'Current State', type: 'string' }, { field: 'execution.startedAt', label: 'Started At', type: 'datetime' });
        fields.push({ field: 'step.approved', label: 'Last Step: Approved', type: 'boolean' }, { field: 'step.completedAt', label: 'Last Step: Completed At', type: 'datetime' }, { field: 'step.result', label: 'Last Step: Result', type: 'object' });
        return fields;
    }
    getAvailableOperators(fieldType) {
        const operators = [
            { value: 'equals', label: 'Equals' },
            { value: 'not_equals', label: 'Not Equals' },
            { value: 'contains', label: 'Contains' }
        ];
        if (fieldType === 'number') {
            operators.push({ value: 'greater_than', label: 'Greater Than' }, { value: 'less_than', label: 'Less Than' });
        }
        if (fieldType === 'array' || fieldType === 'string') {
            operators.push({ value: 'in', label: 'In' }, { value: 'not_in', label: 'Not In' });
        }
        return operators;
    }
};
exports.ConditionalLogicService = ConditionalLogicService;
exports.ConditionalLogicService = ConditionalLogicService = __decorate([
    (0, common_1.Injectable)()
], ConditionalLogicService);
//# sourceMappingURL=conditional-logic.service.js.map
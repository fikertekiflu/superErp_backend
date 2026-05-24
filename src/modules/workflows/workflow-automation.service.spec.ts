import { WorkflowAutomationService } from './workflow-automation.service';

describe('WorkflowAutomationService', () => {
  const service = new WorkflowAutomationService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  it('infers send_email when action is empty but to is set', () => {
    const normalized = service.normalizeStepConfig({
      action: '',
      to: '{{email}}',
      template: 'welcome_employee',
    });

    expect(normalized.actions).toHaveLength(1);
    expect((normalized.actions as any[])[0].type).toBe('send_email');
  });

  it('normalizes template-style config to actions array', () => {
    const normalized = service.normalizeStepConfig({
      action: 'send_email',
      to: '{{employee.email}}',
      template: 'welcome',
    });

    expect(normalized.actions).toHaveLength(1);
    expect((normalized.actions as any[])[0].type).toBe('send_email');
    expect((normalized.actions as any[])[0].config.to).toBe('{{employee.email}}');
  });

  it('defaults send_email to {{email}} when to is missing', () => {
    const normalized = service.normalizeStepConfig({
      action: 'send_email',
    });

    expect((normalized.actions as any[])[0].config.to).toBe('{{email}}');
    expect((normalized.actions as any[])[0].config.template).toBe('workflow_message');
  });

  it('resolves {{field}} from entity data', () => {
    const resolved = service.resolveTemplate('Hello {{email}}', {
      tenantId: 't1',
      triggeredById: 'u1',
      executionId: 'e1',
      entityData: { email: 'jane@acme.com' },
    });

    expect(resolved).toBe('Hello jane@acme.com');
  });

  it('resolves nested path using last segment', () => {
    const resolved = service.resolveTemplate('{{employee.email}}', {
      tenantId: 't1',
      triggeredById: 'u1',
      executionId: 'e1',
      entityData: { email: 'jane@acme.com' },
    });

    expect(resolved).toBe('jane@acme.com');
  });
});

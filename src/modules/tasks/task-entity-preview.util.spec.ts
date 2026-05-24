import { buildTaskEntityPreview } from './task-entity-preview.util';

describe('buildTaskEntityPreview', () => {
  it('orders amount first and formats values', () => {
    const preview = buildTaskEntityPreview(
      { amount: 8000, email: 'a@b.com', notes: 'Travel' },
      {
        entityName: 'Expense',
        fieldDefinitions: [
          { name: 'amount', label: 'Amount', type: 'number' } as any,
          { name: 'email', label: 'Email', type: 'email' } as any,
        ],
      },
    );

    expect(preview?.entityName).toBe('Expense');
    expect(preview?.fields[0].key).toBe('amount');
    expect(preview?.fields[0].displayValue).toBe('8,000');
    expect(preview?.fields.find((f) => f.key === 'email')?.label).toBe('Email');
  });
});

import {
  evaluateConditions,
  evaluateOneCondition,
  resolveEntityFieldValue,
} from './workflow-branching.util';

describe('workflow-branching.util', () => {
  const data = { email: 'a@b.com', amount: 6000, department: 'Finance' };

  it('resolves fields case-insensitively', () => {
    expect(resolveEntityFieldValue(data, 'Email')).toBe('a@b.com');
  });

  it('evaluates greater_than', () => {
    expect(
      evaluateOneCondition(data, {
        field: 'amount',
        operator: 'greater_than',
        value: 5000,
      }),
    ).toBe(true);
  });

  it('matchMode any', () => {
    expect(
      evaluateConditions(
        data,
        [
          { field: 'amount', operator: 'less_than', value: 100 },
          { field: 'amount', operator: 'greater_than', value: 5000 },
        ],
        'any',
      ),
    ).toBe(true);
  });

  it('matchMode all when one fails', () => {
    expect(
      evaluateConditions(
        data,
        [
          { field: 'amount', operator: 'greater_than', value: 5000 },
          { field: 'department', operator: 'equals', value: 'HR' },
        ],
        'all',
      ),
    ).toBe(false);
  });
});

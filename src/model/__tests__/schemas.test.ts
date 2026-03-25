import { baseAssumptionValues } from '../assumptions';
import { assumptionsSchema, scenarioSchema } from '../schemas';

describe('reference-driven schemas', () => {
  it('validates the base assumptions payload from the adapter', () => {
    expect(() => assumptionsSchema.parse(baseAssumptionValues)).not.toThrow();
  });

  it('rejects invalid scenario payloads', () => {
    const result = scenarioSchema.safeParse({
      id: '',
      name: '',
      probability: 140,
      assumptionValues: {
        ...baseAssumptionValues,
        'integrated.global.discount_rate_pct': 'bad',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDirty: false,
      kind: 'saved',
    });

    expect(result.success).toBe(false);
  });
});

import { z } from 'zod';
import { assumptionMetadata } from './assumptions';

const assumptionShape = assumptionMetadata.reduce<Record<string, z.ZodNumber>>(
  (shape, item) => {
    shape[item.key] = z.number().finite();
    return shape;
  },
  {},
);

export const assumptionsSchema = z.object(assumptionShape).strict();

export const scenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  probability: z.number().min(0).max(100),
  assumptionValues: assumptionsSchema,
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  sourceScenarioId: z.string().nullable().optional(),
  isDirty: z.boolean(),
  kind: z.enum(['base', 'saved']),
});

export const scenarioMapSchema = z.record(z.string(), scenarioSchema);

export type AssumptionsPayload = z.infer<typeof assumptionsSchema>;
export type ScenarioPayload = z.infer<typeof scenarioSchema>;

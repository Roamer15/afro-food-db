import { z } from 'zod';
import { SubstituteQualitySchema } from './enums.js';

export const IngredientSubstituteSchema = z
  .object({
    ingredient: z.string().trim().toLowerCase().min(1),
    substitute: z.string().trim().toLowerCase().min(1),
    quality: SubstituteQualitySchema.default('good'),
    notes: z.string().nullable().optional(),
    is_bidirectional: z.boolean().default(false),
  })
  .strict()
  .refine((s) => s.ingredient !== s.substitute, {
    message: 'An ingredient cannot substitute for itself',
  });

export const IngredientSubstituteFileSchema = z
  .array(IngredientSubstituteSchema)
  .refine(
    (entries) => {
      const keys = entries.map((s) => `${s.ingredient}->${s.substitute}`);
      return new Set(keys).size === keys.length;
    },
    {
      message:
        'substitutes.yaml contains a duplicate ingredient/substitute pair',
    },
  );

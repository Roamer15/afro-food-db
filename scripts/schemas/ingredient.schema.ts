import { z } from 'zod';
import { IngredientCategory } from './enums.js';

export const IngredientSchema = z
  .object({
    name: z.string({ error: 'Name is required' }).min(2).max(50).trim().toLowerCase(),
    category: IngredientCategory,
    aliases: z.array(z.string().trim().toLowerCase()).default([]),
  })
  .strict();

export const IngredientFileSchema = z
  .array(IngredientSchema)
  .min(1)
  .refine(
    (ingredients) => {
      const names = ingredients.map((i) => i.name);
      return new Set(names).size === names.length;
    },
    { message: 'Ingredient file contains a duplicate ingredient name' },
  );

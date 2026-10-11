import { z } from 'zod';
import { NoteTypeSchema } from './enums.js';

export const IngredientSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(2).max(50).toLowerCase(),
  category: z.string().nonempty(),
  aliases: z.array(z.string().trim().toLowerCase()).default([]),
}).strict()

export const TagSchema = z.object({
  title: z.string().min(1),
});

export const RecipeIngredientSchema = z
  .object({
    name: z.string().trim().toLowerCase().min(1),
    quantity: z.number().positive().nullable().optional(),
    unit: z.string().nullable().optional(),
    is_optional: z.boolean().default(false),
    notes: z.string().nullable().optional(),
  })
  .strict();

export const RecipeStepSchema = z
  .object({
    title: z.string().nullable().optional(),
    actions: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const RecipeNoteSchema = z.object({
  note: z.string().min(1),
  note_type: NoteTypeSchema.default('general'),
}).strict();

export const IngredientFileSchema = z.array(IngredientSchema)
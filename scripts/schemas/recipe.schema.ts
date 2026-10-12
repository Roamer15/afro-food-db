import { z } from 'zod';
import { DifficultySchema, NoteTypeSchema, UnitSchema } from './enums.js';

const RecipeIngredientSchema = z
  .object({
    name: z.string().trim().toLowerCase().min(1),
    quantity: z.number().positive().nullable().optional(),
    unit: UnitSchema.nullable().optional(),
    is_optional: z.boolean().default(false),
    notes: z.string().nullable().optional(),
  })
  .strict();

const RecipeStepSchema = z
  .object({
    title: z.string().nullable().optional(),
    actions: z.array(z.string().min(1)).min(1),
  })
  .strict();

const RecipeNoteSchema = z
  .object({
    note: z.string().min(1),
    note_type: NoteTypeSchema.default('general'),
  })
  .strict();

export const RecipeSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message:
        'Slug must be URL-safe (lowercase letters, numbers, and hyphens only)',
    }),
    title: z.string().trim().min(2).max(100),
    description: z.string().max(220).min(1),
    country: z.string().trim().min(1),
    region: z.string().min(1).optional(),
    servings: z
      .number()
      .int()
      .positive('Servings must be a positive number')
      .describe(
        'Number of times the meal can be served by following this recipe',
      ),
    prep_time: z
      .number()
      .int()
      .nonnegative('Prep time cannot be a negative number'),
    cook_time: z.number().int().positive('Cook time must be positive'),
    difficulty: DifficultySchema.nullable().optional(),
    image_url: z.url().nullable().optional(),
    image_alt: z.string().nullable().optional(),
    video_url: z.url().nullable().optional(),
    author: z.string().nonempty(),
    source_url: z.url().nullable().optional(),
    ingredients: z
      .array(RecipeIngredientSchema)
      .min(1)
      .refine(
        (ingredients) => {
          const names = ingredients.map((i) => i.name);
          return new Set(names).size === names.length;
        },
        {
          message: 'Ingredient file contains a duplicate ingredient name',
        },
      ),
    steps: z.array(RecipeStepSchema).min(1),
    notes: z.array(RecipeNoteSchema).default([]),
    tags: z.array(z.string().trim().toLowerCase()).default([]),
  })
  .strict();

export type RecipeEntry = z.infer<typeof RecipeSchema>;

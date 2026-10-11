import z from 'zod';
import { DifficultySchema, NoteTypeSchema } from './enums.js';
import {
  RecipeIngredientSchema,
  RecipeNoteSchema,
  RecipeStepSchema,
} from './ingredient.schema.js';

export const RecipeSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message:
        'Slug must be URL-safe (lowercase letters, numbers, and hyphens only)',
    }),
    title: z.string().min(2).max(100),
    description: z.string().max(220).min(1),
    region: z.string().min(1).optional(),
    servings: z
      .number()
      .int()
      .positive('Servings must be a positive number')
      .describe(
        'Number of times the meal can be served by folloeing this recipe',
      ),
    prep_time: z
      .number()
      .int()
      .nonnegative('Prep time must be a positive number'),
    cook_time: z.number().int().positive('Cook time must be postive'),
    difficulty: DifficultySchema.nullable().optional(),
    image_url: z.url().nullable().optional(),
    image_alt: z.string().nullable().optional(),
    video_url: z.url().nullable().optional(),
    author: z.string().nonempty(),
    source_url: z.url().nullable().optional(),
    cuisine_tags: z.array(z.string()),
    ingredients: z.array(RecipeIngredientSchema).min(1),
    steps: z.array(RecipeStepSchema).min(1),
    notes: z.array(RecipeNoteSchema).min(1),
    tags: z.array(z.string().trim().toLowerCase()),
  })
  .strict();

export type RecipeEntry = z.infer<typeof RecipeSchema>;

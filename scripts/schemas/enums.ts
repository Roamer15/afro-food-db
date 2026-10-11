import { z } from 'zod';

const hyphenToUnderscore = (v: unknown) =>
  typeof v === 'string' ? v.replace(/-/g, '_') : v;

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const SubstituteQualitySchema = z.preprocess(
  hyphenToUnderscore,
  z.enum(['ideal', 'good', 'acceptable', 'last_resort']),
);

export const NoteTypeSchema = z.preprocess(
  hyphenToUnderscore,
  z.enum(['substitution', 'pairing', 'make_ahead', 'general']),
);
export const IngredientCategory = z.enum([
  'vegetable',
  'fruit',
  'meat',
  'fish',
  'dairy',
  'oil_fat',
  'seasoning',
  'spice',
  'leaves',
  'seed',
  'liquid',
  'grain',
  'tuber',
  'legume',
  'seafood',
  'other',
]);

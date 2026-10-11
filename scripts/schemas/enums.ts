import { z } from 'zod';

export const SubstituteQualitySchema = z.enum(['ideal', 'good', 'acceptable', 'last_resort']);
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const NoteTypeSchema = z.enum(['substitution', 'pairing', 'make_ahead', 'general']);

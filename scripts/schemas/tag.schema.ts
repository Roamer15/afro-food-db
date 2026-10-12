import { z } from 'zod';

export const TagSchema = z.string().trim().toLowerCase().min(1);

export const TagFileSchema = z
  .array(TagSchema)
  .min(1)
  .refine((tags) => new Set(tags).size === tags.length, {
    message: 'tags.yaml contains a duplicate tag',
  });
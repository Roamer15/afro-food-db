-- Prisma cannot express CHECK constraints in the Prisma schema, so this
-- migration is written by hand and must be maintained by hand.
--
-- WARNING: if a future migration drops and recreates ingredient_substitutes,
-- this constraint is lost silently. Re-add it in that migration.

-- An ingredient must not be listed as a substitute for itself.
ALTER TABLE "ingredient_substitutes"
  ADD CONSTRAINT "no_self_substitute" CHECK (ingredient_id <> substitute_id);

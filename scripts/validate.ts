// scripts/validate.ts
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { IngredientFileSchema } from './schemas/ingredient.schema.js';
import { RecipeSchema } from './schemas/recipe.schema.js';
import { TagFileSchema } from './schemas/tag.schema.js';
import { IngredientSubstituteFileSchema } from './schemas/substitute.schema.js';

type Problem = { file: string; message: string };
const problems: Problem[] = [];
const DATA = 'data';

// Parse a YAML file and validate it; record problems instead of throwing.
function load<T extends z.ZodType>(file: string, schema: T): z.infer<T> | null {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    const message =
      (e as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'File not found'
        : `Cannot read file: ${(e as Error).message}`;
    problems.push({ file, message });
    return null;
  }
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (e) {
    problems.push({ file, message: `Invalid YAML: ${(e as Error).message}` });
    return null;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const where = issue.path.join('.') || '(root)';
      problems.push({ file, message: `${where}: ${issue.message}` });
    }
    return null;
  }
  return result.data;
}

function yamlFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir, { recursive: true, encoding: 'utf8' });
  } catch (e) {
    const message =
      (e as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'Missing directory'
        : `Cannot read directory: ${(e as Error).message}`;
    problems.push({ file: dir, message });
    return [];
  }
  return entries.filter((f) => f.endsWith('.yaml')).map((f) => join(dir, f));
}

// 1. Ingredients: map every name and alias to its canonical name.
const lookup = new Map<string, string>();
for (const file of yamlFiles(join(DATA, 'ingredients'))) {
  for (const ing of load(file, IngredientFileSchema) ?? []) {
    for (const key of [ing.name, ...ing.aliases]) {
      if (lookup.has(key)) {
        problems.push({
          file,
          message: `"${key}" is already defined (refers to "${lookup.get(key)}")`,
        });
      } else {
        lookup.set(key, ing.name);
      }
    }
  }
}

// 2. Tags
const tags = new Set(load(join(DATA, 'tags.yaml'), TagFileSchema) ?? []);

// 3. Recipes
const slugs = new Map<string, string>(); // slug -> file that defined it
for (const file of yamlFiles(join(DATA, 'recipes'))) {
  const recipe = load(file, RecipeSchema);
  if (!recipe) continue;

  const firstFile = slugs.get(recipe.slug);
  if (firstFile) {
    problems.push({
      file,
      message: `slug "${recipe.slug}" is already used in ${firstFile}`,
    });
  }
  slugs.set(recipe.slug, file);

  const used = new Set<string>();
  for (const item of recipe.ingredients) {
    const canonical = lookup.get(item.name);
    if (!canonical) {
      problems.push({
        file,
        message: `unknown ingredient "${item.name}"; add it to data/ingredients/ first`,
      });
      continue;
    }
    if (used.has(canonical)) {
      problems.push({
        file,
        message: `"${item.name}" is listed twice (both resolve to "${canonical}")`,
      });
    }
    used.add(canonical);
  }

  // Every tag in recipe.tags must exist in `tags`.
  for (const tag of recipe.tags) {
    if (!tags.has(tag)) {
      problems.push({
        file,
        message: `"${tag}" doesn't exist in the list of existing tags. The recipe tag should be one of the following ${[...tags].join(', ')}`,
      });
    }
  }
}

// 4. Substitutes
const subsFile = join(DATA, 'substitutes.yaml');
for (const sub of load(subsFile, IngredientSubstituteFileSchema) ?? []) {
  const from = lookup.get(sub.ingredient);
  const to = lookup.get(sub.substitute);

  if (!from) {
    problems.push({ file: subsFile, message: `unknown ingredient "${sub.ingredient}"` });
  }
  if (!to) {
    problems.push({ file: subsFile, message: `unknown substitute "${sub.substitute}"` });
  }
  if (from && to && from === to) {
    problems.push({
      file: subsFile,
      message: `"${sub.ingredient}" and "${sub.substitute}" are the same ingredient`,
    });
  }
}

// Report
if (problems.length > 0) {
  for (const p of problems) console.error(`✗ ${p.file}: ${p.message}`);
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log('✓ All data files are valid.');

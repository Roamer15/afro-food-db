import { join } from 'node:path';
import { IngredientFileSchema } from './schemas/ingredient.schema.js';
import { RecipeSchema } from './schemas/recipe.schema.js';
import { TagFileSchema } from './schemas/tag.schema.js';
import { IngredientSubstituteFileSchema } from './schemas/substitute.schema.js';
import { yamlFiles } from './lib/lib-data.js';
import { load } from './lib/lib-data.js';

type Problem = { file: string; message: string };
const problems: Problem[] = [];
const DATA = process.argv[2] ?? 'data';

// GitHub workflow commands end at a newline, so a multi-line message would be
// truncated and its remainder dumped into the log as loose text.
const escapeData = (s: string) =>
  s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

// Property values additionally need ':' and ',' encoded, since those are separators.
const escapeProp = (s: string) =>
  escapeData(s).replace(/:/g, '%3A').replace(/,/g, '%2C');



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
    problems.push({
      file: subsFile,
      message: `unknown ingredient "${sub.ingredient}"`,
    });
  }
  if (!to) {
    problems.push({
      file: subsFile,
      message: `unknown substitute "${sub.substitute}"`,
    });
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
  const annotate =
    process.env.GITHUB_ACTIONS === 'true' && process.env.NO_ANNOTATIONS !== '1';
  for (const p of problems) {
    if (annotate)
      console.log(
        `::error file=${escapeProp(p.file)},title=Data validation::${escapeData(p.message)}`,
      );
    console.error(`✗ ${p.file}: ${p.message}`);
  }
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log('✓ All data files are valid.');

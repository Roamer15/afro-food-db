# Invalid data fixture

A deliberately broken copy of the `data/` layout. One validator run surfaces all 12 errors below.

## Running it

```bash
# from the repository root
bun run validate -- test/fixtures/invalid-data/data
```

Expect exit code 1 and `12 problem(s) found.`

For comparison, `bun run validate` from the repository root checks the real `data/` and passes.

## Layout notes

The ingredient files are named `a-base.yaml` and `b-extra.yaml` so that directory order reads the
original definition first; otherwise error 10 reports the collision the other way round.

Recipe-level cross-checks (errors 2, 5, 7) only run when a recipe passes schema validation —
`load()` returns `null` on schema failure and the file is skipped. That is why the schema errors
(4, 8, 9) live in a different file from the semantic ones.

The four pre-existing recipe fixtures (`dup-slug-a`, `dup-slug-b`, `schema-errors`,
`semantic-errors`) carry `country: Testland` because `country` is a required field: leaving it out
would make `validate.ts` skip the file and hide the semantic errors they exist to test.

## The twelve errors

Paths are relative to `test/fixtures/invalid-data/`. Messages below are verbatim from a real run.

| # | Error | File | Expected message |
|---|-------|------|------------------|
| 1 | Invalid YAML syntax | `data/recipes/broken-syntax.yaml` | `Invalid YAML: Flow sequence in block collection must be sufficiently indented and end with a ]` (text comes from the `yaml` library) |
| 2 | Unknown ingredient | `data/recipes/semantic-errors.yaml` | `unknown ingredient "unobtainium root"; add it to data/ingredients/ first` |
| 3 | Duplicate slug | `data/recipes/dup-slug-b.yaml` | `slug "dup-slug" is already used in data/recipes/dup-slug-a.yaml` |
| 4 | Invalid slug | `data/recipes/schema-errors.yaml` | `slug: Slug must be URL-safe (lowercase letters, numbers, and hyphens only)` |
| 5 | Tag not in tags.yaml | `data/recipes/semantic-errors.yaml` | `"vegan-ish" doesn't exist in the list of existing tags. The recipe tag should be one of the following main-course, stew` |
| 6 | Substitute resolves to same ingredient | `data/substitutes.yaml` | `"bitterleaf" and "ndole leaves" are the same ingredient` |
| 7 | Same ingredient twice via alias | `data/recipes/semantic-errors.yaml` | `"onions" is listed twice (both resolve to "onion")` |
| 8 | Unknown key (`.strict()`) | `data/recipes/schema-errors.yaml` | `(root): Unrecognized key: "prep_notes"` |
| 9 | `cook_time: 0` | `data/recipes/schema-errors.yaml` | `cook_time: Cook time must be positive` |
| 10 | Alias defined in two ingredient files | `data/ingredients/b-extra.yaml` | `"onions" is already defined (refers to "onion")` |
| 11 | Unit not in `UnitSchema` | `data/recipes/invalid-unit.yaml` | `ingredients.0.unit: Invalid option: expected one of "g"\|"kg"\|"ml"\|"l"\|"tsp"\|"tbsp"\|"cup"\|"piece"\|"clove"\|"cube"\|"stalk"\|"pinch"` |
| 12 | Missing required `country` | `data/recipes/missing-country.yaml` | `country: Invalid input: expected string, received undefined` |

Error 6 is caught by `validate.ts`, not by the Zod schema: `IngredientSubstituteSchema`'s
`.refine()` compares the raw strings, so `bitterleaf` vs `ndole leaves` passes it and only the
canonical-name check in `validate.ts` catches them as the same ingredient.

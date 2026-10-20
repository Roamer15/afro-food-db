import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {parse} from 'yaml'
import {z} from 'zod'

type Problem = { file: string; message: string };
const problems: Problem[] = [];

export function yamlFiles(dir: string): string[] {
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

// Parse a YAML file and validate it; record problems instead of throwing.
export function load<T extends z.ZodType>(file: string, schema: T): z.infer<T> | null {
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

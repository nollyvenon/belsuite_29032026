import * as fs from 'fs';
import * as path from 'path';

const RUNTIME_ROOTS = [path.resolve(process.cwd(), 'src/backend')];
const BLOCKED = /\b(?:TODO|mock|placeholder)\b/;
const BLOCKED_STRICT = /\b(?:simulated|temporary)\b|for now/i;

const EXCLUDED_PATH_SEGMENTS = [
  `${path.sep}__mocks__${path.sep}`,
  `${path.sep}demo${path.sep}`,
  `${path.sep}docs${path.sep}`,
  `${path.sep}doc${path.sep}`,
];

function shouldSkipFile(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  if (!normalized.endsWith('.ts')) return true;
  if (normalized.endsWith('.spec.ts')) return true;
  if (normalized.endsWith('.dto.ts')) return true;
  if (normalized.endsWith('.d.ts')) return true;
  if (normalized.endsWith(`${path.sep}production-gate.runtime.spec.ts`)) return true;
  if (normalized.includes(`${path.sep}demo-`)) return true;
  return EXCLUDED_PATH_SEGMENTS.some((segment) => normalized.includes(segment));
}

function walk(dir: string, out: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!shouldSkipFile(full)) {
      out.push(full);
    }
  }
}

describe('Production runtime gate', () => {
  it('contains no TODO/mock/placeholder tokens in runtime code', () => {
    const files: string[] = [];
    RUNTIME_ROOTS.forEach((root) => walk(root, files));

    const violations: string[] = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (BLOCKED.test(line)) {
          violations.push(`${path.relative(process.cwd(), filePath)}:${index + 1}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('contains no simulated/temporary markers in runtime code', () => {
    const files: string[] = [];
    RUNTIME_ROOTS.forEach((root) => walk(root, files));

    const violations: string[] = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (BLOCKED_STRICT.test(line)) {
          violations.push(`${path.relative(process.cwd(), filePath)}:${index + 1}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});

import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { extname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

function listFiles(directory: string): string[] {
  return readdirSync(resolve(projectRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(child) : [child];
  });
}

describe('repository checks', () => {
  it('includes the required repository and Vercel files', () => {
    const packageJson = JSON.parse(readProjectFile('package.json')) as {
      license: string;
      scripts: Record<string, string>;
    };

    expect(readProjectFile('README.md')).toContain('Data Analyst Interview Bot');
    expect(readProjectFile('LICENSE')).toContain('MIT License');
    expect(JSON.parse(readProjectFile('vercel.json'))).toEqual({
      functions: { 'api/webhook.ts': { maxDuration: 10 } },
    });
    expect(packageJson.scripts['test:run']).toBe('vitest run');
    expect(packageJson.scripts.build).toBe('tsc');
    expect(packageJson.license).toBe('MIT');
  });

  it('type-checks the Vercel webhook as part of the standard TypeScript project', () => {
    const compilerOutput = execFileSync(
      process.execPath,
      [resolve(projectRoot, 'node_modules/typescript/lib/tsc.js'), '--project', 'tsconfig.json', '--listFilesOnly'],
      { cwd: projectRoot, encoding: 'utf8' },
    );
    const projectFiles = compilerOutput
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => relative(projectRoot, file).replaceAll('\\', '/'));

    expect(projectFiles).toContain('api/webhook.ts');
  });

  it('ignores private environment and deployment files while allowing the safe template', () => {
    const gitignore = readProjectFile('.gitignore').split(/\r?\n/);

    expect(gitignore).toContain('.env');
    expect(gitignore).toContain('.env.*');
    expect(gitignore).toContain('!.env.example');
    expect(gitignore).toContain('.vercel');
  });

  it('does not contain a Telegram bot-token shaped value anywhere in the publishable repository surface', () => {
    const tokenPattern = /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/;
    const rootFiles = [
      'README.md',
      'LICENSE',
      '.env.example',
      '.gitignore',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'vercel.json',
    ];
    const repositoryFiles = [
      ...rootFiles,
      ...['src', 'api', 'data', 'tests', 'docs'].flatMap(listFiles),
    ].filter((file) => rootFiles.includes(file) || ['.ts', '.json', '.md'].includes(extname(file)));

    expect(['12345678', 'A'.repeat(35)].join(':')).toMatch(tokenPattern);

    for (const file of repositoryFiles) {
      expect(readProjectFile(file)).not.toMatch(tokenPattern);
    }
  });

  it('keeps personal, employer, behavioral, and out-of-scope coaching content out of every question bank', () => {
    const forbiddenScopePatterns = [
      /\bblackstone\b/i,
      /\bwipro\b/i,
      /\bpersonal background\b/i,
      /\bbehaviou?ral interview\b/i,
      /\b(?:current|previous) (?:job|company|employer)\b/i,
      /\bfinance reporting\b/i,
      /\bquarter[- ]end\b/i,
      /\bprogress tracking\b/i,
      /\bsend (?:a )?reminder/i,
      /\buser profile\b/i,
    ];

    for (const file of listFiles('data/questions')) {
      const contents = readProjectFile(file);
      for (const forbiddenPattern of forbiddenScopePatterns) {
        expect(contents).not.toMatch(forbiddenPattern);
      }
    }
  });
});

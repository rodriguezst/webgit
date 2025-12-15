#!/usr/bin/env node

import { Command } from 'commander';
import { resolve, basename } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(
  (await import('fs')).readFileSync(packageJsonPath, 'utf8')
);

const program = new Command();

program
  .name('webgit')
  .description('A standalone Git viewer web client')
  .version(packageJson.version)
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-d, --dir <path>', 'Path to the git repository (defaults to current directory)')
  .option('-o, --open', 'Open browser automatically after starting')
  .parse(process.argv);

const options = program.opts();

// Resolve repository path
const repoPath = options.dir ? resolve(options.dir) : process.cwd();

// Validate that the path exists
if (!existsSync(repoPath)) {
  console.error(`Error: Directory does not exist: ${repoPath}`);
  process.exit(1);
}

// Validate that it's a git repository
const gitDir = join(repoPath, '.git');
if (!existsSync(gitDir)) {
  console.error(`Error: Not a git repository: ${repoPath}`);
  console.error('Please run webgit from a git repository or specify a valid path with --dir');
  process.exit(1);
}

// Parse port
const port = parseInt(options.port, 10);
if (isNaN(port) || port < 1 || port > 65535) {
  console.error(`Error: Invalid port number: ${options.port}`);
  process.exit(1);
}

// Start the server
const { startServer } = await import('../src/server.js');
startServer({ port, repoPath, open: options.open });

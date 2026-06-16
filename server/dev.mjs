import { spawn } from 'node:child_process';
import path from 'node:path';

const rootDir = process.cwd();
const viteBin = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');

function startProcess(command, args, label) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
      process.exit(code);
    }
  });
  return child;
}

const api = startProcess(process.execPath, ['server/index.mjs'], 'api');
const vite = startProcess(viteBin, ['--host', '0.0.0.0'], 'vite');

const shutdown = () => {
  api.kill('SIGINT');
  vite.kill('SIGINT');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


#!/usr/bin/env node
/**
 * Runs the Counter-Roll on your own computer with one command:  npm run local
 *
 *  - makes a .env.local with a passcode and a private key the first time,
 *  - builds the app the first time (or when you add --rebuild),
 *  - starts it on http://localhost:3000 (set PORT to use another port).
 *
 * Entries are kept in data/local.db inside this folder. Nothing is sent anywhere.
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const say = (s = '') => console.log(s);
const stop = (msg) => { console.error(`\n${msg}\n`); process.exit(1); };

const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 16)) stop(`This needs Node.js 22.16 or newer. You have ${process.versions.node}.\nInstall the current LTS version from https://nodejs.org, open a new terminal window, and run this again.`);

// Node's built-in database prints an "experimental" notice. It is harmless, so keep the window quiet.
const childEnv = { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --disable-warning=ExperimentalWarning`.trim() };

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!fs.existsSync(nextBin)) stop('The app\'s parts are not installed yet.\nType   npm install   and press Enter. When it finishes, run this again.');

const envPath = path.join(root, '.env.local');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, [
    '# Made by npm run local. Change the passcode here if you like, then start the app again.',
    'DATABASE_URL=file:./data/local.db',
    'OWNER_PASSCODE=counter-roll',
    `AUTH_SECRET=${crypto.randomBytes(32).toString('hex')}`,
    '',
  ].join('\n'));
  say('Made a settings file (.env.local) with a passcode and a private key.');
}
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
if (!env.OWNER_PASSCODE || !env.AUTH_SECRET) stop('.env.local is missing OWNER_PASSCODE or AUTH_SECRET.\nDelete the file .env.local and run this again to make a fresh one.');

if (process.argv.includes('--rebuild') || !fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  say('Building the app. The first time takes a minute or two and needs an internet connection (for the fonts).');
  say();
  const built = spawnSync(process.execPath, [nextBin, 'build'], { stdio: 'inherit', cwd: root, env: childEnv });
  if (built.status !== 0) stop('The build did not finish. If the lines above mention fonts or a network error, check your internet connection and run this again.');
}

const port = process.env.PORT || '3000';
say();
say('┌──────────────────────────────────────────────────────────┐');
say('  The Counter-Roll is starting.');
say(`  Open this in your browser:  http://localhost:${port}`);
say(`  Passcode:                   ${env.OWNER_PASSCODE}`);
say('  Keep this window open while you use the app.');
say('  To stop it, press Ctrl+C or close this window.');
say('└──────────────────────────────────────────────────────────┘');
say();

const child = spawn(process.execPath, [nextBin, 'start', '-p', port], { stdio: 'inherit', cwd: root, env: childEnv });
child.on('exit', (code) => process.exit(code ?? 0));

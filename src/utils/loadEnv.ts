/**
 * Load Kandji/Iru MCP environment variables.
 * Canonical credentials for this workspace: ~/dev/.secrets/kandji.env
 * Also loads ~/.secrets/kandji.env (e.g. when symlinked or home-only layout).
 * Finally loads ./.env from cwd — dotenv does not override already-set vars.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';

const KANDJI_ENV_FILENAME = 'kandji.env';

export function loadIruMcpEnv(): void {
  const home = os.homedir();
  const secretPaths = [
    path.join(home, 'dev', '.secrets', KANDJI_ENV_FILENAME),
    path.join(home, '.secrets', KANDJI_ENV_FILENAME),
  ];

  for (const envPath of secretPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }

  dotenv.config();

  // Some vault files use KANDJI_TOKEN; the rest of the codebase expects KANDJI_API_TOKEN.
  if (!process.env.KANDJI_API_TOKEN && process.env.KANDJI_TOKEN) {
    process.env.KANDJI_API_TOKEN = process.env.KANDJI_TOKEN;
  }
}

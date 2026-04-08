import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const firmwareDir = path.join(rootDir, 'firmware');
const releasesPath = path.join(rootDir, 'releases');
const maxVersionsPerType = process.env.MAX_VERSIONS_PER_TYPE || '1';

const releasesJson = execFileSync(process.execPath, ['scripts/update-releases.mjs'], {
  cwd: rootDir,
  env: {
    ...process.env,
    MAX_VERSIONS_PER_TYPE: maxVersionsPerType,
  },
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

const releases = JSON.parse(releasesJson);
const assets = new Map();
for (const release of releases) {
  for (const file of release.files || []) {
    assets.set(file.name, file);
  }
}

await mkdir(firmwareDir, { recursive: true });

for (const [fileName, file] of assets) {
  const targetPath = path.join(firmwareDir, fileName);
  const currentStat = await stat(targetPath).catch(() => null);
  if (currentStat && Number.isFinite(file.size) && currentStat.size === file.size) {
    continue;
  }

  const response = await fetch(file.sourceUrl, {
    headers: {
      'User-Agent': 'meshcore-austria-flasher-sync',
    },
  });
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${fileName}: HTTP ${response.status}`);
  }

  const tempPath = `${targetPath}.tmp`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(tempPath));
  await rename(tempPath, targetPath);
  process.stdout.write(`synced ${fileName}\n`);
}

for (const existingName of await readdir(firmwareDir)) {
  if (!assets.has(existingName)) {
    await rm(path.join(firmwareDir, existingName), { force: true, recursive: true });
    process.stdout.write(`removed ${existingName}\n`);
  }
}

await writeFile(releasesPath, `${JSON.stringify(releases, null, 2)}\n`);
process.stdout.write(`wrote ${assets.size} firmware assets across ${releases.length} release entries\n`);

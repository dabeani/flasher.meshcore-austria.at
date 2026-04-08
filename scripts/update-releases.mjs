const maxVersionsPerType = Number.parseInt(process.env.MAX_VERSIONS_PER_TYPE || '1', 10);

const response = await fetch('https://api.github.com/repos/meshcore-dev/MeshCore/releases?per_page=100', {
  headers: {
    'User-Agent': 'meshcore-austria-flasher-sync',
  },
});

if (!response.ok) {
  throw new Error(`GitHub releases request failed: HTTP ${response.status}`);
}

const releases = await response.json();
const matched = releases.flatMap((release) => {
  const match = release.tag_name?.match(/^(.+?)-(v[\d.]+(?:[-.].+)?)$/);
  if (!match) return [];

  const [, type, version] = match;
  return [{ type, version, release }];
});

const selected = matched.filter(({ type }, index, items) => {
  const seenForType = items.slice(0, index).filter((item) => item.type === type).length;
  return seenForType < maxVersionsPerType;
});

const transformed = selected.map(({ type, version, release }) => ({
  type,
  version,
  name: release.name,
  notes: release.body || '',
  files: (release.assets || []).map((asset) => ({
    name: asset.name,
    url: asset.name,
    sourceUrl: asset.browser_download_url,
    size: asset.size,
  })),
}));

process.stdout.write(`${JSON.stringify(transformed, null, 2)}\n`);

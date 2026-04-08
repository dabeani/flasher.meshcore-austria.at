const response = await fetch('https://api.github.com/repos/meshcore-dev/MeshCore/releases?per_page=100');

if (!response.ok) {
  throw new Error(`GitHub releases request failed: HTTP ${response.status}`);
}

const releases = await response.json();
const transformed = releases.flatMap((release) => {
  const match = release.tag_name?.match(/^(.+?)-(v[\d.]+(?:[-.].+)?)$/);
  if (!match) return [];

  const [, type, version] = match;
  return [{
    type,
    version,
    name: release.name,
    notes: release.body || '',
    files: (release.assets || []).map((asset) => ({
      name: asset.name,
      url: asset.name,
    })),
  }];
});

process.stdout.write(`${JSON.stringify(transformed, null, 2)}\n`);

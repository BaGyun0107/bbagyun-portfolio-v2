import { createHash } from 'node:crypto';

function normalize(value, seen) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('JSON number must be finite');
    return value;
  }
  if (typeof value !== 'object') throw new TypeError(`Unsupported JSON value: ${typeof value}`);
  if (seen.has(value)) throw new TypeError('Cannot serialize circular JSON value');
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((item) => normalize(item, seen));
    const output = {};
    for (const key of Object.keys(value).sort()) output[key] = normalize(value[key], seen);
    return output;
  } finally {
    seen.delete(value);
  }
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value, new Set())).replace(/\r\n?/g, '\n');
}

export function manifestDigest(manifest) {
  const { digest: _digest, generatedAt: _generatedAt, ...payload } = manifest || {};
  return `sha256:${createHash('sha256').update(canonicalJson(payload)).digest('hex')}`;
}

export function verifyManifestDigest(manifest) {
  return Boolean(manifest?.digest) && manifest.digest === manifestDigest(manifest);
}

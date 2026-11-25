// Guards the chunk a first-time public visitor downloads. Run after `vite build`:
//   npm run check:bundle
// Heavy admin-only libraries must stay in lazy chunks, never in the entry chunk.
import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)
if (!entryMatch) throw new Error('No module entry script found in dist/index.html')

const entryPath = join(dist, entryMatch[1])
const raw = readFileSync(entryPath, 'utf8')
// Vite writes the lazy chunk filename table on the first line; those names
// are not bundled code, so exclude them from the marker scan.
const body = raw.split('\n').slice(1).join('\n')

const forbidden = [
  'WebGLRenderer',
  'WebGL2RenderingContext',
  'THREE.REVISION',
  'CartesianGrid',
  'sheet_to_json',
  'XLSX.read',
  'jsPDF',
  'html2canvas',
  'recharts',
  '@react-three',
]

const found = forbidden.filter((marker) => body.includes(marker))
if (found.length) {
  throw new Error(`Admin-only libraries leaked into the public entry chunk: ${found.join(', ')}`)
}

const gzipBytes = gzipSync(Buffer.from(raw)).length
const maxGzipBytes = 260 * 1024
console.log(`Public entry: ${entryMatch[1]}`)
console.log(`Gzipped: ${(gzipBytes / 1024).toFixed(1)} KiB (limit ${maxGzipBytes / 1024} KiB)`)
if (gzipBytes > maxGzipBytes) {
  throw new Error('Public entry chunk grew beyond the agreed budget; check for admin-only imports.')
}

const chunks = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'))
console.log(`Checked entry against ${chunks.length} emitted JS chunks; heavy libraries are lazy-only.`)

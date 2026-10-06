// 星野数据生成器：从 HYG 星表 CSV 生成 src/data/starfield.ts
// 用法：node scripts/build-starfield.mjs <hyg_csv路径> [极限星等，默认5.5]
// 数据来源：HYG Database v3.5（David Nash / astronexus，CC BY-SA 4.0）
// 下载：https://github.com/astronexus/HYG-Database（hyg/v3/hyg_v35.csv.gz）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = process.argv[2] ?? path.join(appRoot, '..', '..', '.hyg-v35.csv')
const limitMag = Number(process.argv[3] ?? 5.5)

function parseLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out
}

const text = fs.readFileSync(csvPath, 'utf8').trim()
const lines = text.split('\n')
const head = parseLine(lines[0])
const iRa = head.indexOf('ra')
const iDec = head.indexOf('dec')
const iMag = head.indexOf('mag')
if (iRa < 0 || iDec < 0 || iMag < 0) throw new Error('CSV 缺少 ra/dec/mag 列')

const rows = []
for (const line of lines.slice(1)) {
  const cols = parseLine(line)
  const mag = Number.parseFloat(cols[iMag])
  if (!Number.isFinite(mag) || mag > limitMag || mag < -20) continue // 剔除太阳与暗星
  const raHours = Number.parseFloat(cols[iRa])
  const dec = Number.parseFloat(cols[iDec])
  if (!Number.isFinite(raHours) || !Number.isFinite(dec)) continue
  rows.push([raHours * 15, Math.round(dec * 1000) / 1000, Math.round(mag * 100) / 100])
}
rows.sort((a, b) => a[2] - b[2]) // 亮星在前

const banner = [
  '// 星野背景数据：由 scripts/build-starfield.mjs 生成，勿手改。',
  `// 来源：HYG Database v3.5（David Nash / astronexus，CC BY-SA 4.0）`,
  `// 口径：星等 ≤ ${limitMag}，J2000 历元，赤经已由小时换算为度；共 ${rows.length} 颗。`,
  `// 生成日期：${new Date().toISOString().slice(0, 10)}`,
].join('\n')

const body = rows.map(([ra, dec, mag]) => `  [${(Math.round(ra * 1000) / 1000).toFixed(3)}, ${dec.toFixed(3)}, ${mag.toFixed(2)}],`).join('\n')
const source = `${banner}\nexport const starfield: [number, number, number][] = [\n${body}\n]\n`
fs.writeFileSync(path.join(appRoot, 'src', 'data', 'starfield.ts'), source)
console.log(`已生成 src/data/starfield.ts：${rows.length} 颗（≤${limitMag} 等）`)

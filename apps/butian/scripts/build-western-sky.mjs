// 88 西方星座连线生成器：从 d3-celestial 的连线数据生成 src/data/western-sky.ts。
// 用法：node scripts/build-western-sky.mjs <constellations.lines.json路径>
// 来源：d3-celestial（Olaf Frohn，BSD-3-Clause），坐标为 J2000 赤经（度）/赤纬（度）。
// 排除 Ori 与 UMa——这两个星座的连线已由 demo 核心星表手绘（沙漏形/北斗），避免双重绘制。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const jsonPath = process.argv[2] ?? path.join(appRoot, '..', '..', '.western-lines.json')
const excluded = new Set(['Ori', 'UMa'])

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
// 同 id 合并（巨蛇座 Serpens 分头尾两段的情形）
const byId = new Map()
for (const feature of data.features) {
  const id = feature.id
  if (excluded.has(id)) continue
  const segments = []
  for (const part of feature.geometry.coordinates) {
    for (let i = 0; i + 1 < part.length; i++) {
      // 源数据赤经用 −180°…+180° 表示，归一化到 0…360°
      const ra1 = ((part[i][0] % 360) + 360) % 360
      const ra2 = ((part[i + 1][0] % 360) + 360) % 360
      segments.push([ra1, part[i][1], ra2, part[i + 1][1]])
    }
  }
  const existing = byId.get(id)
  if (existing) existing.segments.push(...segments)
  else byId.set(id, { id, segments })
}
const groups = [...byId.values()].filter((g) => g.segments.length)
groups.sort((a, b) => a.id.localeCompare(b.id))

const banner = [
  '// 88 西方星座连线：由 scripts/build-western-sky.mjs 生成，勿手改。',
  '// 来源：d3-celestial（Olaf Frohn，BSD-3-Clause，https://github.com/ofrohn/d3-celestial）。',
  `// 坐标为 J2000 赤经（度）/赤纬（度）；排除 Ori/UMa（核心星表已手绘）。共 ${groups.length} 星座 ${groups.reduce((s, g) => s + g.segments.length, 0)} 段。`,
  `// 生成日期：${new Date().toISOString().slice(0, 10)}`,
].join('\n')

const body = groups.map((g) => `  { id: '${g.id}', segments: [\n${g.segments.map((s) => `    [${s.map((v) => (Math.round(v * 10000) / 10000).toString()).join(', ')}],`).join('\n')}\n  ] },`).join('\n')
const source = `${banner}
export type WesternSkyGroup = { id: string; segments: [number, number, number, number][] }

export const westernSkyGroups: WesternSkyGroup[] = [
${body}
]
`
fs.writeFileSync(path.join(appRoot, 'src', 'data', 'western-sky.ts'), source)
console.log(`已生成 src/data/western-sky.ts：${groups.length} 星座 ${groups.reduce((s, g) => s + g.segments.length, 0)} 段连线`)

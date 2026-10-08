// 三垣主官生成器：从 HYG 星表提取坐标，生成 src/data/enclosures.ts。
// 用法：node scripts/build-enclosures.mjs <hyg_csv路径>
// 成员识别为常见口径的手工整理（主官代表星，待校对）；坐标取自 HYG v3.5。
// 成员语法：'bayer:α:Leo|星名' / 'fl:4:UMi|星名' / 'ref:<已有id>|星名'（引用核心/宿表已有星，占位不重复生成）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = process.argv[2] ?? path.join(appRoot, '..', '..', '.hyg-v35.csv')

const westernOf = { UMi: '小熊座', Com: '后发座', Vir: '室女座', Leo: '狮子座', Her: '武仙座', Oph: '蛇夫座' }

const enclosures = [
  {
    id: 'ziwei', name: '紫微垣',
    note: '紫微垣是三垣之中垣，居北天中央，天帝所居。北极帝星近乎不动，众星绕之旋转——「居其所而众星共之」。',
    members: ['ref:gou-1|勾陈一', 'bayer:δ:UMi|勾陈二', 'fl:4:UMi|太子', 'bayer:β:UMi|帝'],
    lines: [['ziwei-1', 'ziwei-2'], ['ziwei-3', 'ziwei-4']],
  },
  {
    id: 'taiwei', name: '太微垣',
    note: '太微垣是三垣之上垣，天帝南郊的朝廷。五帝座一号令其间，垣墙诸星皆是公卿将相，春夜悬于狮子与室女之间。',
    members: ['bayer:α:Com|东上将', 'bayer:β:Leo|五帝座一', 'bayer:β:Vir|西上将'],
    lines: [['taiwei-1', 'taiwei-2'], ['taiwei-2', 'taiwei-3']],
  },
  {
    id: 'tianshi', name: '天市垣',
    note: '天市垣是三垣之下垣，天上的市集。帝座临市，候星察货，诸国列肆其间——古人把人间烟火搬上了星空。夏夜在武仙与蛇夫之间。',
    members: ['bayer:α:Her|帝座', 'bayer:β:Her|河中', 'bayer:α:Oph|候'],
    lines: [['tianshi-1', 'tianshi-2'], ['tianshi-2', 'tianshi-3']],
  },
]

const greekToLatin = { α: 'Alp', β: 'Bet', γ: 'Gam', δ: 'Del', ε: 'Eps', ζ: 'Zet', η: 'Eta', θ: 'The', ι: 'Iot', κ: 'Kap', λ: 'Lam', μ: 'Mu', ν: 'Nu', ξ: 'Xi', ο: 'Omi', π: 'Pi', ρ: 'Rho', σ: 'Sig', τ: 'Tau', υ: 'Ups', φ: 'Phi', χ: 'Chi', ψ: 'Psi', ω: 'Ome' }

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

const rows = []
const text = fs.readFileSync(csvPath, 'utf8').trim()
const lines = text.split('\n')
const head = parseLine(lines[0])
const iRa = head.indexOf('ra'); const iDec = head.indexOf('dec'); const iMag = head.indexOf('mag')
const iBay = head.indexOf('bayer'); const iFlam = head.indexOf('flam'); const iCon = head.indexOf('con')
for (const line of lines.slice(1)) {
  const cols = parseLine(line)
  rows.push({ ra: +cols[iRa], dec: +cols[iDec], mag: +cols[iMag], bayer: cols[iBay], flam: cols[iFlam], con: cols[iCon] })
}

function findStar(kind, key, con) {
  if (kind === 'bayer') {
    const latin = greekToLatin[key]
    if (!latin) throw new Error(`无法识别的希腊字母：${key}`)
    const exact = rows.filter((r) => r.con === con && r.bayer === latin)
    if (exact.length) return exact.sort((a, b) => a.mag - b.mag)[0]
    return rows.filter((r) => r.con === con && r.bayer.startsWith(`${latin}-`)).sort((a, b) => a.mag - b.mag)[0]
  }
  return rows.find((r) => r.con === con && r.flam === key)
}

const starEntries = []
for (const enclosure of enclosures) {
  enclosure.members.forEach((spec, index) => {
    if (spec.startsWith('ref:')) return // 已有星，占位不生成
    const [locator, starName] = spec.split('|')
    const [, key, con] = locator.split(':')
    const kind = locator.startsWith('bayer:') ? 'bayer' : 'flam'
    const star = findStar(kind, key, con)
    if (!star) throw new Error(`${enclosure.name} ${starName}（${key} ${con}）未找到`)
    starEntries.push({
      id: `${enclosure.id}-${index + 1}`,
      name: starName,
      label: kind === 'bayer' ? key : key,
      con,
      x: Math.round(((star.ra / 24) * 100) % 100),
      y: Math.round(90 - star.dec),
      magnitude: Math.round(star.mag * 100) / 100,
      chineseGroup: enclosure.name,
      westernGroup: westernOf[con],
      chineseNote: enclosure.note,
      raHours: Math.round(star.ra * 10000) / 10000,
      decDegrees: Math.round(star.dec * 10000) / 10000,
    })
  })
}

const banner = [
  '// 三垣主官数据：由 scripts/build-enclosures.mjs 生成，勿手改。',
  '// 成员为常见口径的手工整理（各垣代表主官，待校对）；J2000 坐标取自 HYG v3.5（CC BY-SA 4.0）。',
  `// 生成日期：${new Date().toISOString().slice(0, 10)}`,
].join('\n')

const body = starEntries.map((s) => `  { id: '${s.id}', name: '${s.name}', modernName: '${s.name} · ${s.label} ${s.con}', x: ${s.x}, y: ${s.y}, magnitude: ${s.magnitude}, chineseGroup: '${s.chineseGroup}', westernGroup: '${s.westernGroup}', chineseNote: '${s.chineseNote}', raHours: ${s.raHours}, decDegrees: ${s.decDegrees} },`).join('\n')
const lineBody = enclosures.flatMap((e) => e.lines).map(([a, b]) => `  ['${a}', '${b}'],`).join('\n')

const source = `${banner}
import type { Star } from '../types'

export const yuanStars: Star[] = [
${body}
]

export const yuanLines: [string, string][] = [
${lineBody}
]
`
fs.writeFileSync(path.join(appRoot, 'src', 'data', 'enclosures.ts'), source)
console.log(`已生成 src/data/enclosures.ts：${enclosures.length} 垣 ${starEntries.length} 星`)

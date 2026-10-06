// 二十八宿星官数据生成器：按手工整理的成员表，从 HYG 星表提取 J2000 坐标，
// 生成 src/data/lodges.ts（星点 + 连线 + 宿注）。
// 用法：node scripts/build-lodges.mjs <hyg_csv路径>
// 成员识别依据传统星官整理（常见口径），待逐宿校对；坐标来自 HYG（准确）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = process.argv[2] ?? path.join(appRoot, '..', '..', '.hyg-v35.csv')

// —— 宿成员表（距星在首位；bayer 为希腊字母/上标，fl 为弗氏编号；con 为三字星座缩写）——
const memberships = [
  { id: 'jiao', name: '角', con: 'Vir', members: ['bayer:α', 'bayer:ζ'], note: '苍龙之角。周天度量自角宿起算，二十八宿之首，春夜东升。' },
  { id: 'kang', name: '亢', con: 'Vir', members: ['bayer:κ', 'bayer:ι', 'bayer:φ', 'bayer:λ'], note: '龙颈。亢亦有「咽喉」之意，介于角宿与氐宿之间。' },
  { id: 'di', name: '氐', con: 'Lib', members: ['bayer:α²', 'bayer:ι', 'bayer:γ', 'bayer:β'], note: '龙胸，亦作「根」。氐宿四星如天根立地，是秋分前后的标志。' },
  { id: 'fang', name: '房', con: 'Sco', members: ['bayer:π', 'bayer:ρ', 'bayer:δ', 'bayer:β'], note: '天龙之腹，又称「明堂」。房宿四星近乎直线，天蝎的头部。' },
  { id: 'xin', name: '心', con: 'Sco', members: ['bayer:σ', 'bayer:α', 'bayer:τ'], note: '心宿三星当中者即大火（心宿二·Antares）。「七月流火」说的就是它西沉。' },
  { id: 'wei', name: '尾', con: 'Sco', members: ['bayer:μ¹', 'bayer:ε', 'bayer:ζ²', 'bayer:η', 'bayer:θ', 'bayer:ι¹', 'bayer:κ', 'bayer:λ', 'bayer:υ'], note: '苍龙之尾，即天蝎弯钩的毒刺。尾宿九星蜿蜒于银河最亮处。' },
  { id: 'ji', name: '箕', con: 'Sgr', members: ['bayer:γ', 'bayer:δ', 'bayer:ε', 'bayer:η'], note: '簸箕。箕宿四星成梯形，《诗经》「维南有箕，不可以簸扬」。' },
  { id: 'nandou', name: '斗', con: 'Sgr', members: ['bayer:φ', 'bayer:λ', 'bayer:μ', 'bayer:σ', 'bayer:τ', 'bayer:ζ'], note: '南斗六星，与北斗隔天相对。人马座的「奶勺」，浸在银河里。' },
  { id: 'niu', name: '牛', con: 'Cap', members: ['bayer:β', 'bayer:α²', 'bayer:θ', 'bayer:ι', 'bayer:γ'], note: '牵牛之宿（非牛郎星）。牛宿在摩羯座，古以牛宿纪冬至。' },
  { id: 'nv', name: '女', con: 'Aqr', members: ['bayer:ε', 'bayer:μ', 'fl:4', 'fl:3'], note: '婺女，又称须女。宝瓶座一小簇暗星，织布之女的象征。' },
  { id: 'xu', name: '虚', con: 'Aqr', members: ['bayer:β', 'bayer:α'], note: '虚无之宿，古记「虚星为秋分」。尧典「日短星昴」的对宫。' },
  { id: 'weix', name: '危', con: 'Aqr', members: ['bayer:α', 'bayer:θ', 'con+fl:Peg:8'], note: '危者高也，屋脊之象。三星跨宝瓶与飞马，秋夜南中。' },
  { id: 'shi', name: '室', con: 'Peg', members: ['bayer:α', 'bayer:β'], note: '营室，天子的宫室。室壁二宿合为秋季四边形，今夜观天的路标。' },
  { id: 'bi', name: '壁', con: 'Peg', members: ['bayer:γ', 'con+fl:And:21'], note: '东壁，藏书之府。壁宿二（壁宿二·α And）是秋四边形的东北角。' },
  { id: 'kui', name: '奎', con: 'And', members: ['bayer:η', 'bayer:ζ', 'bayer:ε', 'bayer:δ', 'bayer:π', 'bayer:β'], note: '奎为沟渎，又主文运——「奎主文章」。仙女座一线连向飞马。' },
  { id: 'lou', name: '娄', con: 'Ari', members: ['bayer:β', 'bayer:γ', 'bayer:α'], note: '娄者聚也。娄宿三星在白羊座，古以娄宿纪春分日所在。' },
  { id: 'wei2', name: '胃', con: 'Ari', members: ['fl:35', 'fl:39', 'fl:41'], note: '胃为仓廪，天库。白羊座三颗小星，朴素得需要耐心找。' },
  { id: 'mao', name: '昴', con: 'Tau', members: ['fl:17', 'fl:19', 'fl:20', 'fl:23', 'fl:25', 'fl:27', 'fl:28'], note: '昴宿即七姊妹星团。肉眼能数清几颗，自古就是视力的试金石。' },
  { id: 'bii', name: '毕', con: 'Tau', members: ['bayer:ε', 'bayer:δ³', 'bayer:δ¹', 'bayer:γ', 'ref:bi-5', 'bayer:θ', 'bayer:β'], note: '毕是捕兔的网。《诗经》「月离于毕，俾滂沱矣」——月亮走进毕宿要下大雨。' },
  { id: 'zi', name: '觜', con: 'Ori', members: ['bayer:λ', 'bayer:φ¹', 'bayer:φ²'], note: '觜为虎首。觜宿三星在猎户头顶，与参宿距星相距不足一度，古有「觜参之辩」。' },
  { id: 'jing', name: '井', con: 'Gem', members: ['bayer:μ', 'bayer:ε', 'bayer:ζ', 'bayer:γ', 'bayer:ξ', 'bayer:δ', 'bayer:λ'], note: '井为水井，八星如井栏横银河。双子座全域，冬夜最热闹的天区。' },
  { id: 'gui', name: '鬼', con: 'Cnc', members: ['bayer:θ', 'bayer:η', 'bayer:γ', 'bayer:δ', 'bayer:κ'], note: '鬼宿中央的朦胧光斑（积尸气，M44蜂巢星团）肉眼可见，古称「白骨之气」。' },
  { id: 'liu', name: '柳', con: 'Hya', members: ['bayer:δ', 'bayer:σ', 'bayer:η', 'bayer:ρ', 'bayer:ε', 'bayer:ζ', 'bayer:ω', 'bayer:θ'], note: '柳为朱雀之喙。长蛇座一曲垂星，春夜横亘南方。' },
  { id: 'xing', name: '星', con: 'Hya', members: ['bayer:α', 'bayer:τ¹', 'bayer:τ²', 'bayer:ι', 'fl:26', 'fl:27'], note: '七星为朱雀之颈。星宿一（Alphard）独亮于长蛇背上，阿拉伯人称「孤独者」。' },
  { id: 'zhang', name: '张', con: 'Hya', members: ['bayer:ν¹', 'bayer:ν²', 'bayer:μ', 'bayer:λ'], note: '张为朱雀之嗉。春夜南方长蛇中段的小星群。' },
  { id: 'yi', name: '翼', con: 'Crt', members: ['bayer:α', 'bayer:γ', 'bayer:δ', 'bayer:β'], note: '翼为朱雀之翼，廿二星铺开如翅，主体在巨爵座（此处取其代表星）。' },
  { id: 'zhen', name: '轸', con: 'Crv', members: ['bayer:γ', 'bayer:β', 'bayer:δ', 'bayer:ε', 'bayer:η'], note: '轸为车后横木，又主风。乌鸦座五星是春夜的明显路标。' },
]

// 西方星座中文名
const westernOf = { Vir: '室女座', Lib: '天秤座', Sco: '天蝎座', Sgr: '人马座', Cap: '摩羯座', Aqr: '宝瓶座', Peg: '飞马座', And: '仙女座', Ari: '白羊座', Tau: '金牛座', Ori: '猎户座', Gem: '双子座', Cnc: '巨蟹座', Hya: '长蛇座', Crt: '巨爵座', Crv: '乌鸦座' }
const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

// HYG bayer 字段为拉丁三字缩写：无后缀（Alp）或带序号（Alp-2、Del-3）
const greekToLatin = { α: 'Alp', β: 'Bet', γ: 'Gam', δ: 'Del', ε: 'Eps', ζ: 'Zet', η: 'Eta', θ: 'The', ι: 'Iot', κ: 'Kap', λ: 'Lam', μ: 'Mu', ν: 'Nu', ξ: 'Xi', ο: 'Omi', π: 'Pi', ρ: 'Rho', σ: 'Sig', τ: 'Tau', υ: 'Ups', φ: 'Phi', χ: 'Chi', ψ: 'Psi', ω: 'Ome' }
const superscript = { '¹': '-1', '²': '-2', '³': '-3' }

function bayerKey(spec) {
  const match = spec.match(/^(.)([¹²³]?)$/)
  if (!match || !greekToLatin[match[1]]) throw new Error(`无法识别的拜耳编号：${spec}`)
  return greekToLatin[match[1]] + (match[2] ? superscript[match[2]] : '')
}

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

function findStar(spec, con) {
  if (spec.startsWith('bayer:')) {
    const wanted = spec.slice(6)
    const key = bayerKey(wanted)
    const base = key.split('-')[0]
    const exact = rows.filter((r) => r.con === con && r.bayer === key)
    if (exact.length) return exact.sort((a, b) => a.mag - b.mag)[0]
    const plain = rows.filter((r) => r.con === con && r.bayer === base)
    if (plain.length) return plain.sort((a, b) => a.mag - b.mag)[0]
    const loose = rows.filter((r) => r.con === con && r.bayer.startsWith(`${base}-`))
    return loose.sort((a, b) => a.mag - b.mag)[0]
  }
  if (spec.startsWith('con+fl:')) {
    const [, altCon, flam] = spec.split(':')
    return rows.find((r) => r.con === altCon && r.flam === flam)
  }
  const flam = spec.slice(3)
  return rows.find((r) => r.con === con && r.flam === flam)
}

const starEntries = []
const lineEntries = []
for (const lodge of memberships) {
  const ids = []
  lodge.members.forEach((spec, index) => {
    // ref: 引用核心星表中已有的星（占用序号、参与连线，不重复生成）
    if (spec.startsWith('ref:')) {
      ids.push(spec.slice(4))
      return
    }
    const star = findStar(spec, lodge.con)
    if (!star) throw new Error(`${lodge.name}宿第 ${index + 1} 星未找到：${spec}`)
    const id = `${lodge.id}-${index + 1}`
    ids.push(id)
    const label = spec.startsWith('bayer:') ? spec.slice(6) : `fl:${spec.split(':').pop()}`
    starEntries.push({
      id,
      name: `${lodge.name}宿${digits[index + 1]}`,
      modernName: `${lodge.name}宿${digits[index + 1]} · ${label.replace('fl:', '')} ${spec.startsWith('con+fl:') ? spec.split(':')[1] : lodge.con}`,
      x: Math.round(((star.ra / 24) * 100) % 100),
      y: Math.round(90 - star.dec),
      magnitude: Math.round(star.mag * 100) / 100,
      chineseGroup: `${lodge.name}宿`,
      westernGroup: westernOf[spec.startsWith('con+fl:') ? spec.split(':')[1] : lodge.con],
      chineseNote: lodge.note,
      raHours: Math.round(star.ra * 10000) / 10000,
      decDegrees: Math.round(star.dec * 10000) / 10000,
    })
  })
  for (let i = 0; i + 1 < ids.length; i++) lineEntries.push([ids[i], ids[i + 1]])
}

const banner = [
  '// 二十八宿星官数据：由 scripts/build-lodges.mjs 生成，勿手改。',
  '// 成员识别为常见口径的手工整理（待逐宿校对）；J2000 坐标取自 HYG v3.5（CC BY-SA 4.0）。',
  '// 参宿已在 demo.ts 核心星表中，此处不含。距星在各宿首位。',
  `// 生成日期：${new Date().toISOString().slice(0, 10)}`,
].join('\n')

const serializeStars = (entries) => entries.map((s) => `  { id: '${s.id}', name: '${s.name}', modernName: '${s.modernName}', x: ${s.x}, y: ${s.y}, magnitude: ${s.magnitude}, chineseGroup: '${s.chineseGroup}', westernGroup: '${s.westernGroup}', chineseNote: '${s.chineseNote}', raHours: ${s.raHours}, decDegrees: ${s.decDegrees} },`).join('\n')
const serializeLines = (entries) => entries.map(([a, b]) => `  ['${a}', '${b}'],`).join('\n')

const source = `${banner}
import type { Star } from '../types'

export const lodgeStars: Star[] = [
${serializeStars(starEntries)}
]

export const lodgeChinaLines: [string, string][] = [
${serializeLines(lineEntries)}
]
`
fs.writeFileSync(path.join(appRoot, 'src', 'data', 'lodges.ts'), source)
console.log(`已生成 src/data/lodges.ts：${memberships.length} 宿 ${starEntries.length} 星 ${lineEntries.length} 条连线`)

// 预生成传播物料：两张 1080×1440 分享卡（SVG 母版，PNG 由 Edge headless 栅格化后一并提交）。
// 数据与读数全部来自应用同源模块（astro/kestar/demo），保证分享卡与产品永远说同一套话。
// 用法：node scripts/build-share-assets.mjs   （产物写入 public/share/，随 vite 构建部署到 Pages）
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatDegrees, formatLodgeEntry, northPolarDistance } from '../src/lib/astro.ts'
import { guestStarCoord, theaterScenes } from '../src/lib/kestar.ts'
import { stars } from '../src/data/demo.ts'

const OUT = join(import.meta.dirname, '..', 'public', 'share')
mkdirSync(OUT, { recursive: true })

const GOLD = '#c9a45c'
const GOLD_DIM = 'rgba(228, 203, 148, 0.85)'
const INK = '#2c2632'
const INK_SOFT = '#6c5844'
const BLUE_GREY = '#aebdd4'
const SITE = '《步天》· wyhcipuc.github.io/guanxiang'
const PRECISION = '教学精度 · J2000 历元 · 未含岁差与折射修正'

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------- 卡一：参宿 vs 猎户 对照卡（深空风，与 App 品牌一致） ----------
// 等比局部投影：32px/度（赤经 1h=15°→480px），参宿中心（RA 5.65h, Dec +2°）为原点。
// 卖点：同一组七星、两种连法——金色实线是中国星官身形，灰蓝细线是西方沙漏。
{
  const shen = stars.filter((star) => star.id.startsWith('shen-'))
  const cx = 5.65
  const cy = 2
  const kDeg = 38 // px per degree
  const ox = 540
  const oy = 690
  const pos = (ra, dec) => ({ x: ox - (ra - cx) * kDeg * 15, y: oy - (dec - cy) * kDeg }) // 赤经向左增（天球东向）
  const radius = (mag) => Math.max(7, 22 - mag * 6)
  const pts = Object.fromEntries(shen.map((star) => [star.id, pos(star.raHours, star.decDegrees)]))

  // 双组连线：中式=金色实线（虎身），西式=灰蓝虚线（沙漏）——虚实对照，一眼分家
  const zhLink = (a, b) => `<line x1="${pts[a].x}" y1="${pts[a].y}" x2="${pts[b].x}" y2="${pts[b].y}" stroke="rgba(201, 164, 92, 0.72)" stroke-width="3"/>`
  const enLink = (a, b) => `<line x1="${pts[a].x}" y1="${pts[a].y}" x2="${pts[b].x}" y2="${pts[b].y}" stroke="rgba(140, 165, 200, 0.55)" stroke-width="2" stroke-dasharray="10 7"/>`
  const lines = [
    // 中国连法：虎身——双肩各入腰带，腰带分坠双足
    zhLink('shen-5', 'shen-2'), zhLink('shen-2', 'shen-4'),
    zhLink('shen-1', 'shen-2'), zhLink('shen-2', 'shen-3'),
    zhLink('shen-4', 'shen-7'), zhLink('shen-5', 'shen-6'),
    // 西方连法：沙漏——肩连肩、足连足、双肩斜挂双足
    enLink('shen-4', 'shen-5'), enLink('shen-6', 'shen-7'),
    enLink('shen-5', 'shen-6'), enLink('shen-4', 'shen-7'),
  ].join('')

  // 引线标签栏：每星单行「中文名 · 西名」分挂两侧，槽位就近分配
  const slots = Array.from({ length: 7 }, (_, index) => 500 + index * 80)
  const leftFree = [...slots]
  const rightFree = [...slots]
  const pick = (pool, y) => {
    let best = 0
    pool.forEach((slot, index) => Math.abs(slot - y) < Math.abs(pool[best] - y) && (best = index))
    return pool.splice(best, 1)[0]
  }
  const byHeight = [...shen].sort((a, b) => pos(a.raHours, a.decDegrees).y - pos(b.raHours, b.decDegrees).y)
  const leaderRows = byHeight.map((star, index) => {
    const p = pos(star.raHours, star.decDegrees)
    const r = radius(star.magnitude)
    const toLeft = index % 2 === 0
    const slotY = toLeft ? pick(leftFree, p.y) : pick(rightFree, p.y)
    const barX = toLeft ? 306 : 774
    return `
    <line x1="${p.x + (toLeft ? -r - 6 : r + 6)}" y1="${p.y}" x2="${barX}" y2="${slotY - 9}" stroke="rgba(201, 164, 92, 0.35)" stroke-width="1.4"/>
    <text x="${toLeft ? 296 : 784}" y="${slotY}" text-anchor="${toLeft ? 'end' : 'start'}" font-size="27" fill="${GOLD_DIM}" font-family="serif">${esc(star.name)} <tspan font-size="20" fill="${BLUE_GREY}" font-family="sans-serif">· ${esc(star.commonName)}</tspan></text>`
  }).join('')

  const starMarks = shen.map((star) => {
    const p = pos(star.raHours, star.decDegrees)
    const r = radius(star.magnitude)
    return `
    <circle cx="${p.x}" cy="${p.y}" r="${r + 10}" fill="url(#glow)"/>
    <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#f2ebdd"/>`
  }).join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <defs><radialGradient id="glow"><stop offset="0%" stop-color="rgba(242,235,221,0.55)"/><stop offset="100%" stop-color="rgba(242,235,221,0)"/></radialGradient></defs>
  <rect width="1080" height="1440" fill="#0b1020"/>
  <rect x="36" y="36" width="1008" height="1368" rx="12" fill="none" stroke="rgba(201, 164, 92, 0.4)" stroke-width="2"/>
  <text x="540" y="150" text-anchor="middle" font-size="58" fill="#f2ebdd" font-family="serif">同一片天空，两套名字</text>
  <text x="540" y="205" text-anchor="middle" font-size="30" fill="${GOLD}" font-family="serif" letter-spacing="6">参宿 · Orion 猎户座</text>
  <line x1="360" y1="240" x2="720" y2="240" stroke="rgba(201, 164, 92, 0.5)" stroke-width="2"/>
  ${lines}
  ${starMarks}
  ${leaderRows}
  <text x="120" y="1136" font-size="24" fill="${GOLD_DIM}" font-family="serif">— 金色实线 · 中国星官的连法（虎身）</text>
  <text x="120" y="1172" font-size="24" fill="${BLUE_GREY}" font-family="sans-serif">┄ 灰蓝虚线 · 西方星座的连法（沙漏）</text>
  <text x="120" y="1238" font-size="30" fill="#e8e2d4" font-family="serif">七星还是那七星：中国人连成白虎之身，</text>
  <text x="120" y="1282" font-size="30" fill="#e8e2d4" font-family="serif">希腊人连成猎户沙漏——谁先看，谁命名。</text>
  <text x="540" y="1352" text-anchor="middle" font-size="20" fill="rgba(174, 189, 212, 0.75)" font-family="sans-serif">${SITE} · ${PRECISION}</text>
</svg>`
  writeFileSync(join(OUT, 'shen-vs-orion.svg'), svg)
}

// ---------- 卡二：1054 客星帖（宣纸奏折风，读数与 App 剧场同源实时计算） ----------
{
  const peak = theaterScenes.find((scene) => scene.id === 'peak') ?? theaterScenes[0]
  const ru = formatLodgeEntry(guestStarCoord.raHours)
  const ju = formatDegrees(northPolarDistance(guestStarCoord.decDegrees))
  // 局部星图：客星与天关星（ζ Tau）的真实相对位置（约 1.5° 视场）
  const guan = { raHours: 5.6274, decDegrees: 21.1425 }
  const field = (ra, dec) => ({ x: 540 + (ra - guestStarCoord.raHours) * 2000, y: 672 - (dec - guestStarCoord.decDegrees) * 2000 })
  const guest = field(guestStarCoord.raHours, guestStarCoord.decDegrees)
  const guanPos = field(guan.raHours, guan.decDegrees)

  const timeline = theaterScenes.map((scene) => {
    const [lunarDate, gregorian, phase] = scene.title.split(' · ')
    const y = 906 + theaterScenes.indexOf(scene) * 84
    const active = scene.id === peak.id
    return `
    <circle cx="160" cy="${y - 9}" r="7" fill="${active ? '#b94a48' : 'rgba(44,38,50,0.35)'}"/>
    <text x="190" y="${y}" font-size="28" fill="${active ? '#2c2632' : INK_SOFT}" font-family="serif" ${active ? 'font-weight="bold"' : ''}>${esc(scene.label)} · ${esc(gregorian)} · ${esc(phase)}</text>
    <text x="190" y="${y + 32}" font-size="22" fill="rgba(108, 88, 68, 0.95)" font-family="serif">${esc(lunarDate)}</text>`
  }).join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <rect width="1080" height="1440" fill="#efe1bf"/>
  <rect x="44" y="44" width="992" height="1352" rx="10" fill="none" stroke="#a67d42" stroke-width="4"/>
  <rect x="492" y="118" width="96" height="96" rx="10" fill="#b94a48"/>
  <text x="540" y="172" text-anchor="middle" font-size="34" fill="#f5ead7" font-family="serif">步天</text>
  <text x="540" y="206" text-anchor="middle" font-size="18" fill="#f5ead7" font-family="serif" letter-spacing="4">钤印</text>
  <line x1="516" y1="222" x2="564" y2="222" stroke="#a67d42" stroke-width="2"/>
  <text x="540" y="330" text-anchor="middle" font-size="64" fill="${INK}" font-family="serif" letter-spacing="14">客星帖</text>
  <text x="540" y="382" text-anchor="middle" font-size="28" fill="${INK_SOFT}" font-family="serif">至和元年 · 天关星旁 · 六百五十三日</text>
  <line x1="240" y1="420" x2="840" y2="420" stroke="#a67d42" stroke-width="2"/>
  <text x="540" y="470" text-anchor="middle" font-size="30" fill="${INK}" font-family="serif">「${esc(peak.quote)}」</text>
  <text x="540" y="508" text-anchor="middle" font-size="22" fill="${INK_SOFT}" font-family="serif">—— ${esc(peak.source)}</text>
  <circle cx="${guest.x}" cy="${guest.y}" r="48" fill="rgba(185, 74, 72, 0.18)"/>
  <circle cx="${guest.x}" cy="${guest.y}" r="14" fill="#b94a48"/>
  <text x="${guest.x + 26}" y="${guest.y - 26}" font-size="30" fill="#b94a48" font-family="serif" font-weight="bold">客星</text>
  <circle cx="${guanPos.x}" cy="${guanPos.y}" r="11" fill="${INK}"/>
  <text x="${guanPos.x + 18}" y="${guanPos.y + 36}" font-size="26" fill="${INK}" font-family="serif">天关</text>
  <text x="540" y="852" text-anchor="middle" font-size="24" fill="${INK_SOFT}" font-family="serif">客星紧挨天关星 · 相对位置按真实坐标绘制（约 1.5° 视场）</text>
  ${timeline}
  <text x="540" y="1258" text-anchor="middle" font-size="34" fill="${INK}" font-family="serif">极盛夜浑仪读数 · ${esc(ru)}</text>
  <text x="540" y="1306" text-anchor="middle" font-size="34" fill="${INK}" font-family="serif">去极度 · ${esc(ju)}</text>
  <text x="540" y="1360" text-anchor="middle" font-size="22" fill="#7d6c58" font-family="serif">即今日之蟹状星云（M1）· 教学示意：绝对方位按 J2000 近似</text>
  <text x="540" y="1388" text-anchor="middle" font-size="20" fill="#7d6c58" font-family="sans-serif">${SITE}</text>
</svg>`
  writeFileSync(join(OUT, 'guest-star-1054.svg'), svg)
}

console.log('分享物料已生成：shen-vs-orion.svg + guest-star-1054.svg → public/share/')

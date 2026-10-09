// 天文计算（教学精度）——引擎已上收共享内核 @guanxiang/core（packages/core，docs/07-P2共享内核盘点.md）。
// 本文件保留：二十八宿表与入宿度/去极度（中国天文语义）、"今夜"时刻语义，并作为既有 import 路径的兼容门面。
// 精度口径：J2000.0 历元，未做岁差归算与大气折射修正；恒星时为 IAU 1982 平恒星时公式。
import { formatDegrees } from '@guanxiang/core/format'

export { DEG, greenwichSiderealTimeHours, localSiderealTimeHours, starHorizontal, isRising, projectOnDome, findRiseTime } from '@guanxiang/core/sidereal'
export type { Equatorial, Horizontal, SkyPlacement } from '@guanxiang/core/sidereal'
export { formatClock, formatDegrees, formatSignedDegrees, formatHours, compassLabel } from '@guanxiang/core/format'

/** "HH:MM"（24 小时制，本地时间）；凌晨时刻自动落到明天 */
export function tonightAt(label: string, base = new Date()): Date {
  const [hourText, minuteText] = label.split(':')
  const hour = Number(hourText)
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, Number(minuteText), 0, 0)
  if (hour < 12) date.setDate(date.getDate() + 1)
  return date
}

export type Lodge = { name: string; determinative: string; raHours: number; decDegrees: number }

/**
 * 二十八宿距星坐标（J2000；赤经赤纬取自 HYG v3.5，2026-10-09 已逐宿对照
 * 维基/TheSkyLive/SIMBAD 权威值核验通过，误差 ≤0.0003°，报告见 docs/butian/lodge-calibration.md）。
 * 按传统顺序 角→轸 排列。觜宿距星（觜宿一 λ Ori）与参宿距星（参宿三 δ Ori）
 * 在 J2000 相差不足一度，觜宿在当今天球上呈“负宽度”——这是历史上著名的
 * “觜参之辩”。这里将其视为退化宿：不认领任何星，其天区并入参宿。
 */
export const lodges: Lodge[] = [
  { name: '角', determinative: '角宿一 · α Vir', raHours: 13.4199, decDegrees: -11.1613 },
  { name: '亢', determinative: '亢宿一 · κ Vir', raHours: 14.2149, decDegrees: -10.2737 },
  { name: '氐', determinative: '氐宿一 · α Lib', raHours: 14.848, decDegrees: -16.0418 },
  { name: '房', determinative: '房宿一 · π Sco', raHours: 15.9809, decDegrees: -26.1141 },
  { name: '心', determinative: '心宿一 · σ Sco', raHours: 16.3531, decDegrees: -25.5928 },
  { name: '尾', determinative: '尾宿一 · μ¹ Sco', raHours: 16.8645, decDegrees: -38.0474 },
  { name: '箕', determinative: '箕宿一 · γ Sgr', raHours: 18.0968, decDegrees: -30.4241 },
  { name: '斗', determinative: '斗宿一 · φ Sgr', raHours: 18.7609, decDegrees: -26.9908 },
  { name: '牛', determinative: '牛宿一 · β Cap', raHours: 20.3502, decDegrees: -14.7814 },
  { name: '女', determinative: '女宿一 · ε Aqr', raHours: 20.7946, decDegrees: -9.4958 },
  { name: '虚', determinative: '虚宿一 · β Aqr', raHours: 21.526, decDegrees: -5.5712 },
  { name: '危', determinative: '危宿一 · α Aqr', raHours: 22.0964, decDegrees: -0.3199 },
  { name: '室', determinative: '室宿一 · α Peg', raHours: 23.0793, decDegrees: 15.2053 },
  { name: '壁', determinative: '壁宿一 · γ Peg', raHours: 0.2206, decDegrees: 15.1836 },
  { name: '奎', determinative: '奎宿一 · η And', raHours: 0.9534, decDegrees: 23.4176 },
  { name: '娄', determinative: '娄宿一 · β Ari', raHours: 1.9107, decDegrees: 20.808 },
  { name: '胃', determinative: '胃宿一 · 35 Ari', raHours: 2.7242, decDegrees: 27.7071 },
  { name: '昴', determinative: '昴宿一 · 17 Tau', raHours: 3.7479, decDegrees: 24.1133 },
  { name: '毕', determinative: '毕宿一 · ε Tau', raHours: 4.4769, decDegrees: 19.1804 },
  { name: '觜', determinative: '觜宿一 · λ Ori', raHours: 5.5856, decDegrees: 9.9342 },
  { name: '参', determinative: '参宿三 · δ Ori', raHours: 5.5334, decDegrees: -0.2991 },
  { name: '井', determinative: '井宿一 · μ Gem', raHours: 6.3827, decDegrees: 22.5136 },
  { name: '鬼', determinative: '鬼宿一 · θ Cnc', raHours: 8.5266, decDegrees: 18.0944 },
  { name: '柳', determinative: '柳宿一 · δ Hya', raHours: 8.6276, decDegrees: 5.7038 },
  { name: '星', determinative: '星宿一 · α Hya', raHours: 9.4598, decDegrees: -8.6586 },
  { name: '张', determinative: '张宿一 · ν¹ Hya', raHours: 10.8271, decDegrees: -16.1936 },
  { name: '翼', determinative: '翼宿一 · α Crt', raHours: 10.9962, decDegrees: -18.2988 },
  { name: '轸', determinative: '轸宿一 · γ Crv', raHours: 12.2634, decDegrees: -17.5419 },
]

const LODGE_SPAN_LIMIT_DEGREES = 180

/**
 * 入宿度：星之赤经落在哪一宿的距星之后、且距该距星多少度。
 * 退化宿（跨度超过半周，即传统意义上的“负宽度”）不参与认领；
 * 若多宿皆可认领（觜参交界），取入宿度最小者。
 */
export function lodgeEntry(raHours: number): { lodge: string; entryDegrees: number } {
  let best: { lodge: string; entryDegrees: number } | null = null
  lodges.forEach((lodge, index) => {
    const next = lodges[(index + 1) % lodges.length]
    const spanDegrees = (((next.raHours - lodge.raHours) * 15) % 360 + 360) % 360
    if (spanDegrees > LODGE_SPAN_LIMIT_DEGREES) return
    const entryDegrees = (((raHours - lodge.raHours) * 15) % 360 + 360) % 360
    if (entryDegrees >= spanDegrees) return
    if (!best || entryDegrees < best.entryDegrees) best = { lodge: lodge.name, entryDegrees }
  })
  if (!best) return { lodge: '未知', entryDegrees: 0 }
  return best
}

/** 入宿度读数字符串，如 "入参宿 5°47′" */
export function formatLodgeEntry(raHours: number): string {
  const { lodge, entryDegrees } = lodgeEntry(raHours)
  return `入${lodge}宿 ${formatDegrees(entryDegrees)}`
}

/** 去极度：天球北极到该星的角距，即 90° − 赤纬 */
export function northPolarDistance(decDegrees: number): number {
  return 90 - decDegrees
}

// 天文计算（教学精度）
// - 坐标基于 J2000.0 历元，未做岁差归算与大气折射修正
// - 古度（周天 365.25 度）与今度（360°）未做换算，统一使用现代度
// - 恒星时采用 IAU 1982 平恒星时公式

export const DEG = Math.PI / 180

export type Equatorial = { raHours: number; decDegrees: number }
export type Horizontal = { altitude: number; azimuth: number }
export type SkyPlacement = { x: number; y: number; above: boolean }

/** 格林尼治平恒星时（小时） */
export function greenwichSiderealTimeHours(date: Date): number {
  const days = date.getTime() / 86400000 + 2440587.5 - 2451545.0
  const degrees = 280.46061837 + 360.98564736629 * days
  return (((degrees % 360) + 360) % 360) / 15
}

/** 本地恒星时（小时），longitudeEast 东经为正 */
export function localSiderealTimeHours(date: Date, longitudeEast: number): number {
  return (((greenwichSiderealTimeHours(date) + longitudeEast / 15) % 24) + 24) % 24
}

/** 赤道坐标 → 地平坐标；azimuth 自北向东量度（北 0°，东 90°） */
export function starHorizontal(star: Equatorial, date: Date, latitude: number, longitudeEast: number): Horizontal {
  const hourAngle = (localSiderealTimeHours(date, longitudeEast) - star.raHours) * 15 * DEG
  const dec = star.decDegrees * DEG
  const lat = latitude * DEG
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle)
  const altitude = Math.asin(Math.min(1, Math.max(-1, sinAlt))) / DEG
  const fromSouth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat))
  const azimuth = (fromSouth / DEG + 180 + 360) % 360
  return { altitude, azimuth }
}

/** 该星在指定时刻是否正在升高（用于区分“尚未升起”与“已落下”） */
export function isRising(star: Equatorial, date: Date, latitude: number, longitudeEast: number): boolean {
  const earlier = starHorizontal(star, new Date(date.getTime() - 40 * 60000), latitude, longitudeEast).altitude
  const later = starHorizontal(star, new Date(date.getTime() + 40 * 60000), latitude, longitudeEast).altitude
  return later > earlier
}

/**
 * 天穹俯视投影：天顶居中、北在上、东在左（仰望星空的星图习惯）。
 * 地平线以上按球极投影落位；以下的星贴在地平圈外缘，交由界面弱化显示。
 */
export function projectOnDome(position: Horizontal): SkyPlacement {
  const zenithDistance = Math.max(0, 90 - position.altitude)
  const radius = position.altitude >= 0
    ? Math.tan((zenithDistance / 2) * DEG)
    : 1.02 + Math.min(0.06, -position.altitude / 500)
  const az = position.azimuth * DEG
  return {
    x: 50 - 47 * radius * Math.sin(az),
    y: 50 - 47 * radius * Math.cos(az),
    above: position.altitude >= 0,
  }
}

/** 在 from 之后 searchHours 小时内寻找该星越过地平线的时刻，找不到返回 null */
export function findRiseTime(star: Equatorial, from: Date, latitude: number, longitudeEast: number, searchHours = 12, stepMinutes = 5): Date | null {
  const stepMs = stepMinutes * 60000
  const end = from.getTime() + searchHours * 3600000
  let previous = starHorizontal(star, from, latitude, longitudeEast).altitude
  for (let t = from.getTime() + stepMs; t <= end; t += stepMs) {
    const current = starHorizontal(star, new Date(t), latitude, longitudeEast).altitude
    if (previous < 0 && current >= 0) return new Date(t)
    previous = current
  }
  return null
}

/** "HH:MM"（24 小时制，本地时间）；凌晨时刻自动落到明天 */
export function tonightAt(label: string, base = new Date()): Date {
  const [hourText, minuteText] = label.split(':')
  const hour = Number(hourText)
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, Number(minuteText), 0, 0)
  if (hour < 12) date.setDate(date.getDate() + 1)
  return date
}

export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** 82.59 → "82°36′" */
export function formatDegrees(value: number): string {
  const totalMinutes = Math.round(Math.abs(value) * 60)
  return `${Math.floor(totalMinutes / 60)}°${String(totalMinutes % 60).padStart(2, '0')}′`
}

export function formatSignedDegrees(value: number): string {
  return `${value < 0 ? '−' : '+'}${formatDegrees(Math.abs(value))}`
}

/** 5.9195 → "5h55m" */
export function formatHours(hours: number): string {
  const normalized = ((hours % 24) + 24) % 24
  const totalMinutes = Math.round(normalized * 60)
  return `${Math.floor(totalMinutes / 60)}h${String(totalMinutes % 60).padStart(2, '0')}m`
}

/** 方位角 → 八方位中文名 */
export function compassLabel(azimuth: number): string {
  const names = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return names[Math.round((((azimuth % 360) + 360) % 360) / 45) % 8]
}

export type Lodge = { name: string; determinative: string; raHours: number; decDegrees: number }

/**
 * 二十八宿距星坐标（J2000；赤经赤纬取自 HYG v3.5，与 src/data/lodges.ts 交叉校验）。
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

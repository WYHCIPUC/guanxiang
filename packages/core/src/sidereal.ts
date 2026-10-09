// 共享内核 · 恒星时与地平坐标引擎（教学精度）
// - 坐标基于 J2000.0 历元，未做岁差归算与大气折射修正
// - 古度（周天 365.25 度）与今度（360°）未做换算，统一使用现代度
// - 恒星时采用 IAU 1982 平恒星时公式
// 迁移自 apps/butian/src/lib/astro.ts（2026-10-09，行为不变，数值锚点见步天 astro-check）

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

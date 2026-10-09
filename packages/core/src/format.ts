// 共享内核 · 度分秒与方位格式化
// 迁移自 apps/butian/src/lib/astro.ts（2026-10-09，行为不变）

/** "HH:MM"（24 小时制，本地时间） */
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

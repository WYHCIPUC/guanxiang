import type { Observation, Star } from '../types'
import {
  compassLabel,
  formatDegrees,
  formatHours,
  formatLodgeEntry,
  formatSignedDegrees,
  isRising,
  northPolarDistance,
  starHorizontal,
} from './astro'

/**
 * 生成一次观测读数。入宿度、去极度、赤经、赤纬均由 J2000 星表坐标实时换算：
 * - 去极度 = 90° − 赤纬
 * - 入宿度 = 该星赤经与所在宿距星赤经之差
 * 教学精度：未做岁差归算与大气折射修正。
 */
export function makeObservation(star: Star, location: string, timeLabel: string, moment: Date, latitude: number, longitude: number): Observation {
  const horizontal = starHorizontal(star, moment, latitude, longitude)
  const altitudeNote = horizontal.altitude >= 0
    ? `观测时刻地平高度 ${formatDegrees(horizontal.altitude)} · 方位${compassLabel(horizontal.azimuth)}`
    : `观测时刻该星${isRising(star, moment, latitude, longitude) ? '尚未升起' : '已落下'}`
  return {
    star,
    location,
    timeLabel,
    ru: formatLodgeEntry(star.raHours),
    ju: `去极 ${formatDegrees(northPolarDistance(star.decDegrees))}`,
    ra: formatHours(star.raHours),
    dec: formatSignedDegrees(star.decDegrees),
    altitudeNote,
  }
}

export function downloadMemorial(observation: Observation, mode: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1280" viewBox="0 0 900 1280">
    <rect width="900" height="1280" fill="#efe1bf"/>
    <rect x="38" y="38" width="824" height="1204" rx="10" fill="none" stroke="#a67d42" stroke-width="3"/>
    <rect x="412" y="80" width="76" height="76" rx="8" fill="#b94a48"/>
    <rect x="419" y="87" width="62" height="62" rx="5" fill="none" stroke="#f5ead7" stroke-width="1.6"/>
    <text x="450" y="112" text-anchor="middle" font-size="19" fill="#f5ead7" font-family="serif">步天</text>
    <text x="450" y="134" text-anchor="middle" font-size="13" fill="#f5ead7" font-family="serif" letter-spacing="4">钤印</text>
    <text x="450" y="225" text-anchor="middle" font-size="44" fill="#2c2632" font-family="serif">星图奏折</text>
    <text x="450" y="280" text-anchor="middle" font-size="24" fill="#6c5844" font-family="serif">钦天监学徒习测 · ${mode}</text>
    <line x1="130" y1="330" x2="770" y2="330" stroke="#a67d42" stroke-width="2"/>
    <text x="450" y="430" text-anchor="middle" font-size="54" fill="#2c2632" font-family="serif">${observation.star.name}</text>
    <text x="450" y="485" text-anchor="middle" font-size="26" fill="#6c5844" font-family="sans-serif">${observation.star.modernName}</text>
    <text x="450" y="590" text-anchor="middle" font-size="31" fill="#2c2632" font-family="serif">${observation.location} · ${observation.timeLabel}</text>
    <text x="450" y="640" text-anchor="middle" font-size="22" fill="#6c5844" font-family="serif">${observation.altitudeNote}</text>
    <text x="450" y="720" text-anchor="middle" font-size="32" fill="#2c2632" font-family="serif">${observation.ru}</text>
    <text x="450" y="780" text-anchor="middle" font-size="32" fill="#2c2632" font-family="serif">${observation.ju}</text>
    <text x="450" y="880" text-anchor="middle" font-size="30" fill="#2c2632" font-family="serif">现代坐标：${observation.ra} · ${observation.dec}</text>
    <text x="450" y="970" text-anchor="middle" font-size="24" fill="#6c5844" font-family="sans-serif">同一片天空，两套名字，一次教学测量</text>
    <text x="450" y="1025" text-anchor="middle" font-size="21" fill="#7d6c58" font-family="sans-serif">教学近似值：J2000 历元，未含岁差与折射修正</text>
    <text x="450" y="1150" text-anchor="middle" font-size="20" fill="#7d6c58" font-family="sans-serif">《步天》原型 · 数据来源待正式版本补充</text>
  </svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `步天-星图奏折-${observation.star.name}.svg`
  link.click()
  URL.revokeObjectURL(url)
}

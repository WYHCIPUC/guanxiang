export const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
import { getStarOfficer } from '../data/stars.js'
import { getSolarTerm } from '../data/solar-terms.js'
export const elements = [
  { key: 'wood', label: '木', color: '#5f9f7e', soft: '#234738', hint: '生长、舒展与向外探索' },
  { key: 'fire', label: '火', color: '#e06b55', soft: '#542c2a', hint: '明亮、表达与热烈行动' },
  { key: 'earth', label: '土', color: '#d5ae67', soft: '#554325', hint: '承托、平衡与稳定感' },
  { key: 'metal', label: '金', color: '#e9e0c9', soft: '#49463d', hint: '边界、判断与收束' },
  { key: 'water', label: '水', color: '#6895a8', soft: '#233841', hint: '流动、感受与深度' },
]

const stemElementKeys = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water']
const branchElementKeys = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water']
const monthStemStarts = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]
const solarMonthStarts = [
  [1, 6, 1], [2, 4, 2], [3, 6, 3], [4, 5, 4], [5, 6, 5], [6, 6, 6],
  [7, 7, 7], [8, 8, 8], [9, 8, 9], [10, 8, 10], [11, 7, 11], [12, 7, 0],
]

export function hashText(text) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mod(value, divisor) { return ((value % divisor) + divisor) % divisor }

function parseDateValue(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) throw new Error('日期格式无效')
  const [year, month, day] = dateValue.split('-').map(Number)
  if (!year || !month || !day) throw new Error('日期格式无效')
  const timestamp = Date.UTC(year, month - 1, day, 12)
  const normalized = new Date(timestamp)
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 || normalized.getUTCDate() !== day) throw new Error('日期无效')
  const dayNumber = Math.floor(timestamp / 86400000)
  return { year, month, day, dayNumber, julianDay: 2440588 + dayNumber }
}

function yearPillarDate({ year, month, day }) {
  return month < 2 || (month === 2 && day < 4) ? year - 1 : year
}

function solarMonthBranch({ month, day }) {
  let branchIndex = 0
  for (const [startMonth, startDay, nextBranch] of solarMonthStarts) {
    if (month > startMonth || (month === startMonth && day >= startDay)) branchIndex = nextBranch
  }
  return branchIndex
}

function countElements(pillars) {
  const counts = Object.fromEntries(elements.map((element) => [element.key, 0]))
  for (const pillar of pillars) {
    counts[stemElementKeys[pillar.stemIndex]] += 1
    counts[branchElementKeys[pillar.branchIndex]] += 1
  }
  const total = pillars.length * 2
  return elements.map((element) => ({
    ...element,
    score: counts[element.key],
    percent: Math.round((counts[element.key] / total) * 100),
  }))
}

export function calculateProfile(name, dateValue) {
  const date = parseDateValue(dateValue)
  const pillarYear = yearPillarDate(date)
  const seed = hashText(`${name}|${dateValue}`)
  const yearStemIndex = mod(pillarYear - 4, 10)
  const yearBranchIndex = mod(pillarYear - 4, 12)
  const monthBranchIndex = solarMonthBranch(date)
  const monthStemIndex = mod(monthStemStarts[yearStemIndex] + mod(monthBranchIndex - 2, 12), 10)
  const dayStemIndex = mod(date.julianDay + 9, 10)
  const dayBranchIndex = mod(date.julianDay + 1, 12)
  const pillarIndexes = [
    { stemIndex: yearStemIndex, branchIndex: yearBranchIndex },
    { stemIndex: monthStemIndex, branchIndex: monthBranchIndex },
    { stemIndex: dayStemIndex, branchIndex: dayBranchIndex },
  ]
  const pillars = [
    { title: '年柱', value: `${stems[yearStemIndex]}${branches[yearBranchIndex]}`, note: '按立春近似分界的年份标记', ...pillarIndexes[0] },
    { title: '月柱', value: `${stems[monthStemIndex]}${branches[monthBranchIndex]}`, note: '按节气近似边界的月份标记', ...pillarIndexes[1] },
    { title: '日柱', value: `${stems[dayStemIndex]}${branches[dayBranchIndex]}`, note: '按公历日序推导的日期标记', ...pillarIndexes[2] },
  ]
  const scores = countElements(pillarIndexes)
  const dominant = [...scores].sort((a, b) => b.score - a.score)[0]
  return { name: name || '观星者', dateValue, seed, pillars, scores, dominant, star: getStarOfficer(dateValue), solarTerm: getSolarTerm(dateValue), calendarMode: 'solar-approximation' }
}

export function createPattern(profile) {
  const points = []
  for (let i = 0; i < 15; i += 1) {
    const angle = Math.PI * 2 * i / 15
    const radius = 32 + ((profile.seed >> (i % 16)) & 20)
    points.push(`${50 + Math.cos(angle) * radius / 1.7},${50 + Math.sin(angle) * radius}`)
  }
  return points.join(' ')
}

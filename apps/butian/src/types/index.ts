export type SkyMode = 'china' | 'western' | 'both'

export type Star = {
  id: string
  name: string
  modernName: string
  /** 计算失败时兜底用的静态位置（百分比） */
  x: number
  y: number
  magnitude: number
  chineseGroup: string
  westernGroup: string
  chineseNote: string
  /** J2000 赤经（小时） */
  raHours: number
  /** J2000 赤纬（度） */
  decDegrees: number
}

export type LocationOption = {
  id: string
  name: string
  hint: string
  latitude: number
  longitude: number
}

export type Observation = {
  star: Star
  location: string
  timeLabel: string
  ru: string
  ju: string
  ra: string
  dec: string
  altitudeNote: string
}

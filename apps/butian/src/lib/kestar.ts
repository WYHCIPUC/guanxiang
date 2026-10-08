// 天关客星（SN 1054，今蟹状星云 M1）剧场数据与场景。
// 坐标 J2000（教学精度：未做岁差归算，1054 年绝对方位为近似，星官相对位置正确）。
// 史料：《宋史·天文志》《宋会要辑稿》相关记载（公版）。
import type { Star } from '../types'

/** 客星位置 = 蟹状星云 M1（超新星遗骸中心） */
export const guestStarCoord = { raHours: 5.5753, decDegrees: 22.0144 }

/** 剧场用的“可测星”记录：复用测量面板与奏折的读数管线 */
export const guestStarRecord: Star = {
  id: 'kestar',
  name: '天关客星',
  modernName: 'SN 1054 · 蟹状星云 M1',
  x: 50,
  y: 40,
  magnitude: -6,
  chineseGroup: '客星',
  westernGroup: '金牛座',
  chineseNote: '至和元年五月己丑，客星出天关东南。它此后二十三日白昼可见，六百五十三天后暗去——千年后我们叫它蟹状星云。',
  raHours: guestStarCoord.raHours,
  decDegrees: guestStarCoord.decDegrees,
}

/** 剧场观测地：北宋汴京（开封） */
export const kaifeng = { name: '汴京（开封）', latitude: 34.797, longitude: 114.307 }

export type TheaterScene = {
  id: string
  label: string
  title: string
  quote: string
  source: string
  note: string
  /** 场景时刻（UTC 毫秒；本地按东八区口径近似北宋开封地方时，教学精度） */
  utc: number
  /** 该场景客星是否肉眼可见 */
  visible: boolean
  /** 白昼场景：天穹做白昼化处理，唯客星可见 */
  daytime?: boolean
}

export const theaterScenes: TheaterScene[] = [
  {
    id: 'first',
    label: '初见',
    title: '至和元年五月己丑 · 公元 1054 年 7 月 4 日 · 黎明',
    quote: '至和元年五月己丑，客星出天关东南，可数寸，岁余稍没。',
    source: '《宋史 · 天文志》',
    note: '黎明时分，客星在东方低空、紧挨天关星（ζ Tau）乍现，亮度胜过太白。此后二十三日，它白昼可见。',
    utc: Date.UTC(1054, 6, 3, 20, 30),
    visible: true,
  },
  {
    id: 'day',
    label: '昼见',
    title: '次日正午 · 公元 1054 年 7 月 5 日 · 白昼',
    quote: '昼见如太白，芒角四出，色赤白，凡见二十三日。',
    source: '《宋会要辑稿》',
    note: '烈日当空，满天星辰尽数隐没，唯独这颗客星仍亮得刺眼——如太白（金星）悬于西南高天。古人因此知道：这不是一颗普通的星。',
    utc: Date.UTC(1054, 6, 5, 4, 0),
    visible: true,
    daytime: true,
  },
  {
    id: 'peak',
    label: '极盛',
    title: '至和元年岁末 · 公元 1054 年 12 月 28 日 · 夜半前',
    quote: '昼见如太白，芒角四出，色赤白，凡见二十三日。',
    source: '《宋会要辑稿》',
    note: '深夜客星接近天顶，高悬正南。古人若以浑仪测之，当得下方的入宿度与去极度。',
    utc: Date.UTC(1054, 11, 28, 15, 30),
    visible: true,
  },
  {
    id: 'fade',
    label: '没灭',
    title: '嘉祐元年三月 · 公元 1056 年 4 月 · 岁余稍没',
    quote: '（凡见）六百五十三日……至嘉祐元年三月乃没。',
    source: '据《宋史》纪年推算',
    note: '六百五十三夜之后，客星终于暗到肉眼不可见。同一天区今天留着一团蟹状星云——那次超新星爆发的遗骸。',
    utc: Date.UTC(1056, 3, 16, 13, 0),
    visible: false,
  },
]

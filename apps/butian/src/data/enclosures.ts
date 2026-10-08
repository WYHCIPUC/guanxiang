// 三垣主官数据：由 scripts/build-enclosures.mjs 生成，勿手改。
// 成员为常见口径的手工整理（各垣代表主官，待校对）；J2000 坐标取自 HYG v3.5（CC BY-SA 4.0）。
// 生成日期：2026-10-08
import type { Star } from '../types'

export const yuanStars: Star[] = [
  { id: 'ziwei-2', name: '勾陈二', modernName: '勾陈二 · δ UMi', x: 73, y: 3, magnitude: 4.35, chineseGroup: '紫微垣', westernGroup: '小熊座', chineseNote: '紫微垣是三垣之中垣，居北天中央，天帝所居。北极帝星近乎不动，众星绕之旋转——「居其所而众星共之」。', raHours: 17.5369, decDegrees: 86.5865 },
  { id: 'ziwei-3', name: '太子', modernName: '太子 · 4 UMi', x: 59, y: 12, magnitude: 4.8, chineseGroup: '紫微垣', westernGroup: '小熊座', chineseNote: '紫微垣是三垣之中垣，居北天中央，天帝所居。北极帝星近乎不动，众星绕之旋转——「居其所而众星共之」。', raHours: 14.1475, decDegrees: 77.5475 },
  { id: 'ziwei-4', name: '帝', modernName: '帝 · β UMi', x: 62, y: 16, magnitude: 2.07, chineseGroup: '紫微垣', westernGroup: '小熊座', chineseNote: '紫微垣是三垣之中垣，居北天中央，天帝所居。北极帝星近乎不动，众星绕之旋转——「居其所而众星共之」。', raHours: 14.8451, decDegrees: 74.1555 },
  { id: 'taiwei-1', name: '东上将', modernName: '东上将 · α Com', x: 55, y: 72, magnitude: 4.32, chineseGroup: '太微垣', westernGroup: '后发座', chineseNote: '太微垣是三垣之上垣，天帝南郊的朝廷。五帝座一号令其间，垣墙诸星皆是公卿将相，春夜悬于狮子与室女之间。', raHours: 13.1665, decDegrees: 17.5294 },
  { id: 'taiwei-2', name: '五帝座一', modernName: '五帝座一 · β Leo', x: 49, y: 75, magnitude: 2.14, chineseGroup: '太微垣', westernGroup: '狮子座', chineseNote: '太微垣是三垣之上垣，天帝南郊的朝廷。五帝座一号令其间，垣墙诸星皆是公卿将相，春夜悬于狮子与室女之间。', raHours: 11.8177, decDegrees: 14.5721 },
  { id: 'taiwei-3', name: '西上将', modernName: '西上将 · β Vir', x: 49, y: 88, magnitude: 3.59, chineseGroup: '太微垣', westernGroup: '室女座', chineseNote: '太微垣是三垣之上垣，天帝南郊的朝廷。五帝座一号令其间，垣墙诸星皆是公卿将相，春夜悬于狮子与室女之间。', raHours: 11.8449, decDegrees: 1.7647 },
  { id: 'tianshi-1', name: '帝座', modernName: '帝座 · α Her', x: 72, y: 76, magnitude: 2.78, chineseGroup: '天市垣', westernGroup: '武仙座', chineseNote: '天市垣是三垣之下垣，天上的市集。帝座临市，候星察货，诸国列肆其间——古人把人间烟火搬上了星空。夏夜在武仙与蛇夫之间。', raHours: 17.2441, decDegrees: 14.3903 },
  { id: 'tianshi-2', name: '河中', modernName: '河中 · β Her', x: 69, y: 69, magnitude: 2.78, chineseGroup: '天市垣', westernGroup: '武仙座', chineseNote: '天市垣是三垣之下垣，天上的市集。帝座临市，候星察货，诸国列肆其间——古人把人间烟火搬上了星空。夏夜在武仙与蛇夫之间。', raHours: 16.5037, decDegrees: 21.4896 },
  { id: 'tianshi-3', name: '候', modernName: '候 · α Oph', x: 73, y: 77, magnitude: 2.08, chineseGroup: '天市垣', westernGroup: '蛇夫座', chineseNote: '天市垣是三垣之下垣，天上的市集。帝座临市，候星察货，诸国列肆其间——古人把人间烟火搬上了星空。夏夜在武仙与蛇夫之间。', raHours: 17.5822, decDegrees: 12.56 },
]

export const yuanLines: [string, string][] = [
  ['ziwei-1', 'ziwei-2'],
  ['ziwei-3', 'ziwei-4'],
  ['taiwei-1', 'taiwei-2'],
  ['taiwei-2', 'taiwei-3'],
  ['tianshi-1', 'tianshi-2'],
  ['tianshi-2', 'tianshi-3'],
]

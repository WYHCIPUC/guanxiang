import type { LocationOption, Star } from '../types'

// 观测地点（坐标取城市代表点，教学精度）
export const locations: LocationOption[] = [
  { id: 'beijing', name: '北京', hint: '北纬 39.9° · 东经 116.4°', latitude: 39.9042, longitude: 116.4074 },
  { id: 'shanghai', name: '上海', hint: '北纬 31.2° · 东经 121.5°', latitude: 31.2304, longitude: 121.4737 },
  { id: 'guangzhou', name: '广州', hint: '北纬 23.1° · 东经 113.3°', latitude: 23.1291, longitude: 113.2644 },
]

// 恒星数据：J2000 赤经赤纬为手工整理的标准值（教学精度，正式版本需接入核验过的星表）。
// 星官命名按传统星名：参宿七星、北斗七星。
export const stars: Star[] = [
  // 参宿（猎户座）
  { id: 'shen-1', name: '参宿一', modernName: '参宿一 · ζ Ori', x: 28, y: 38, magnitude: 1.7, chineseGroup: '参宿', westernGroup: '猎户座', chineseNote: '参宿三星之首。三星连线冬夜高挂正南，古人视为白虎之身。', raHours: 5.6793, decDegrees: -1.9428 },
  { id: 'shen-2', name: '参宿二', modernName: '参宿二 · ε Ori', x: 36, y: 44, magnitude: 1.7, chineseGroup: '参宿', westernGroup: '猎户座', chineseNote: '居三星之中，几乎恰在天赤道上，古今星表都爱用它定标。', raHours: 5.6035, decDegrees: -1.2019 },
  { id: 'shen-3', name: '参宿三', modernName: '参宿三 · δ Ori', x: 44, y: 39, magnitude: 2.2, chineseGroup: '参宿', westernGroup: '猎户座', chineseNote: '参宿距星——古人量“入参宿几度”，就从这颗星起算。', raHours: 5.5334, decDegrees: -0.2991 },
  { id: 'shen-4', name: '参宿四', modernName: '参宿四 · α Ori', x: 58, y: 32, magnitude: 0.5, chineseGroup: '参宿', westernGroup: '猎户座', chineseNote: '橙红色超巨星，亮度会变。“参宿四”这个名字比 Betelgeuse 早了一千多年。', raHours: 5.9195, decDegrees: 7.4071 },
  { id: 'shen-5', name: '参宿五', modernName: '参宿五 · γ Ori', x: 49, y: 25, magnitude: 1.6, chineseGroup: '参宿', westernGroup: '猎户座', chineseNote: '参宿西北肩，与参宿四一西一东撑开虎身。', raHours: 5.4189, decDegrees: 6.3497 },
  { id: 'shen-6', name: '参宿六', modernName: '参宿六 · κ Ori', x: 52, y: 66, magnitude: 2.1, chineseGroup: '参宿', westernGroup: '猎户座', chineseNote: '参宿东南足，与参宿七遥遥相对。', raHours: 5.7959, decDegrees: -9.6697 },
  { id: 'shen-7', name: '参宿七', modernName: '参宿七 · β Ori', x: 63, y: 62, magnitude: 0.1, chineseGroup: '参宿', westernGroup: '猎户座', chineseNote: '蓝白色亮星，猎户的西足，也是参宿的西南角。', raHours: 5.2423, decDegrees: -8.2016 },
  // 北斗（大熊座）
  { id: 'dou-1', name: '天枢', modernName: '天枢 · α UMa', x: 18, y: 18, magnitude: 1.8, chineseGroup: '北斗', westernGroup: '大熊座', chineseNote: '斗口第一星。“枢”即天轴，古人把它视为帝星运转的枢纽。', raHours: 11.0622, decDegrees: 61.7508 },
  { id: 'dou-2', name: '天璇', modernName: '天璇 · β UMa', x: 26, y: 13, magnitude: 2.4, chineseGroup: '北斗', westernGroup: '大熊座', chineseNote: '天璇与天枢连线向外延长约五倍，就指向北极星，古称“指极”。', raHours: 11.0307, decDegrees: 56.3825 },
  { id: 'dou-3', name: '天玑', modernName: '天玑 · γ UMa', x: 35, y: 12, magnitude: 2.4, chineseGroup: '北斗', westernGroup: '大熊座', chineseNote: '斗口第三星，与天权、天璇、天枢共同围成斗魁。', raHours: 11.8972, decDegrees: 53.6947 },
  { id: 'dou-4', name: '天权', modernName: '天权 · δ UMa', x: 44, y: 18, magnitude: 3.3, chineseGroup: '北斗', westernGroup: '大熊座', chineseNote: '斗魁四星中最暗的一颗，却稳居斗口另一角。', raHours: 12.2571, decDegrees: 57.0325 },
  { id: 'dou-5', name: '玉衡', modernName: '玉衡 · ε UMa', x: 53, y: 26, magnitude: 1.8, chineseGroup: '北斗', westernGroup: '大熊座', chineseNote: '斗柄第一星。“衡”意为称量——北斗在古代也是一杆量时间的秤。', raHours: 12.9005, decDegrees: 55.9597 },
  { id: 'dou-6', name: '开阳', modernName: '开阳 · ζ UMa', x: 61, y: 35, magnitude: 2.2, chineseGroup: '北斗', westernGroup: '大熊座', chineseNote: '旁边藏着一颗“辅星”，古代军中曾用能否看清它来测视力。', raHours: 13.3987, decDegrees: 54.9253 },
  { id: 'dou-7', name: '摇光', modernName: '摇光 · η UMa', x: 68, y: 46, magnitude: 1.9, chineseGroup: '北斗', westernGroup: '大熊座', chineseNote: '斗柄末梢。斗柄指向随季节旋转，古人据它辨四季。', raHours: 13.7923, decDegrees: 49.3131 },
]

// 中国星官连线：突出“参宿三星”这条腰带，四肢以折线勾出虎形
export const chinaLines: [string, string][] = [
  ['shen-5', 'shen-1'], ['shen-1', 'shen-2'], ['shen-2', 'shen-3'], ['shen-3', 'shen-4'],
  ['shen-2', 'shen-6'], ['shen-3', 'shen-7'], ['shen-6', 'shen-7'],
  ['dou-1', 'dou-2'], ['dou-2', 'dou-3'], ['dou-3', 'dou-4'], ['dou-4', 'dou-5'], ['dou-5', 'dou-6'], ['dou-6', 'dou-7'],
]

// 西方星座连线：猎户座经典的“沙漏形”，不连腰带
export const westernLines: [string, string][] = [
  ['shen-4', 'shen-5'], ['shen-4', 'shen-1'], ['shen-5', 'shen-3'],
  ['shen-1', 'shen-6'], ['shen-3', 'shen-7'], ['shen-6', 'shen-7'],
  ['dou-1', 'dou-2'], ['dou-2', 'dou-3'], ['dou-3', 'dou-4'], ['dou-4', 'dou-5'], ['dou-5', 'dou-6'], ['dou-6', 'dou-7'],
]

export const timeLabels = ['19:30', '20:30', '21:30', '23:00', '00:30', '02:00', '03:30']

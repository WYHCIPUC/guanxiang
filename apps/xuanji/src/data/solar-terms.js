const termStarts = [
  [1, 6, '小寒', '寒意渐深，光线开始回返'], [1, 20, '大寒', '一年最静的时段，蓄力等待转身'],
  [2, 4, '立春', '新的轮廓从地面浮起'], [2, 19, '雨水', '柔软的水意开始进入万物'],
  [3, 6, '惊蛰', '沉睡的事物被一声春雷唤醒'], [3, 21, '春分', '昼夜各半，世界趋向平衡'],
  [4, 5, '清明', '空气变得清亮，远近都可辨认'], [4, 20, '谷雨', '细密的雨把生长推向更深处'],
  [5, 6, '立夏', '热度初起，枝叶开始舒张'], [5, 21, '小满', '事物渐满，但仍保留余地'],
  [6, 6, '芒种', '忙碌与播种同时发生'], [6, 21, '夏至', '日光抵达一年最盛处'],
  [7, 7, '小暑', '热意上升，风仍保留轻盈'], [7, 23, '大暑', '热度达到峰值，万物显出浓度'],
  [8, 8, '立秋', '喧闹之后，收束的方向出现'], [8, 23, '处暑', '热意退潮，空气开始清醒'],
  [9, 8, '白露', '夜里的水汽把边界描亮'], [9, 23, '秋分', '光与暗再次平分'],
  [10, 8, '寒露', '清冷加深，细节变得突出'], [10, 23, '霜降', '季节进入更坚定的收拢'],
  [11, 7, '立冬', '世界向内，安静成为力量'], [11, 22, '小雪', '微小的变化开始覆盖大地'],
  [12, 7, '大雪', '白色扩大，时间放慢脚步'], [12, 22, '冬至', '黑夜抵达极点，回返由此开始'],
]

export const solarTerms = termStarts.map(([month, day, name, theme], index) => ({ month, day, name, theme, index }))

export function getSolarTerm(dateValue) {
  const [, monthText, dayText] = dateValue.split('-')
  const month = Number(monthText)
  const day = Number(dayText)
  let current = solarTerms[solarTerms.length - 1]
  for (const term of solarTerms) {
    if (month > term.month || (month === term.month && day >= term.day)) current = term
  }
  return { ...current, mode: 'approximate-fixed-dates' }
}

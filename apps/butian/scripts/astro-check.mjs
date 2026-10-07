// 天文计算校验：用 Node 内置类型剥离直接导入 src/lib/astro.ts 并运行断言。
// 覆盖：恒星时锚点、地平坐标、天穹投影、入宿度/去极度、升起时刻、日期处理、HYG 星表抽检。
import * as astro from '../src/lib/astro.ts'
import { starfield } from '../src/data/starfield.ts'
import { lodgeStars } from '../src/data/lodges.ts'
import { stars as demoStars } from '../src/data/demo.ts'

const assert = (condition, message) => {
  if (!condition) throw new Error(`天文计算校验失败：${message}`)
}
const near = (actual, expected, tolerance, message) => {
  assert(Math.abs(actual - expected) <= tolerance, `${message}（实际 ${actual}，期望 ${expected} ±${tolerance}）`)
}

const BEIJING = { latitude: 39.9042, longitude: 116.4074 }
const POLARIS = { raHours: 2.5303, decDegrees: 89.2641 }
const MINTAKA = { raHours: 5.5334, decDegrees: -0.2991 }   // 参宿三 · δ Ori（参宿距星）
const BETELGEUSE = { raHours: 5.9195, decDegrees: 7.4071 } // 参宿四 · α Ori
const DUBHE = { raHours: 11.0622, decDegrees: 61.7508 }    // 天枢 · α UMa

// 1. 恒星时锚点：J2000 历元（2000-01-01 12:00 UT）格林尼治平恒星时 = 18.697374h
near(astro.greenwichSiderealTimeHours(new Date(Date.UTC(2000, 0, 1, 12, 0, 0))), 18.697374, 0.001, 'GMST 在 J2000 历元应为 18.697374h')

// 2. 本地恒星时 = GMST + 经度/15（东经为正）
{
  const date = new Date(Date.UTC(2026, 9, 6, 12, 0, 0))
  const gmst = astro.greenwichSiderealTimeHours(date)
  const lst = astro.localSiderealTimeHours(date, BEIJING.longitude)
  const offset = (((lst - gmst - BEIJING.longitude / 15) % 24) + 24) % 24
  near(Math.min(offset, 24 - offset), 0, 0.0001, '本地恒星时应加上东经经度')
}

// 3. 北极星高度 ≈ 当地纬度（任意时刻均成立）
{
  const position = astro.starHorizontal(POLARIS, new Date(Date.UTC(2026, 9, 6, 12, 0, 0)), BEIJING.latitude, BEIJING.longitude)
  near(position.altitude, BEIJING.latitude, 0.8, '北极星地平高度应接近当地纬度')
}

// 4. 中天自洽：用模块自身的恒星时找到参宿三过中天的时刻，高度应精确等于 90° − |纬度 − 赤纬|，方位正南
{
  const start = new Date(Date.UTC(2026, 9, 6, 11, 0, 0)) // 北京 10-06 19:00
  let best = null
  for (let t = start.getTime(); t <= start.getTime() + 12 * 3600000; t += 60000) {
    const lst = astro.localSiderealTimeHours(new Date(t), BEIJING.longitude)
    const distance = Math.min(Math.abs(lst - MINTAKA.raHours), 24 - Math.abs(lst - MINTAKA.raHours))
    if (!best || distance < best.distance) best = { t, distance }
  }
  const position = astro.starHorizontal(MINTAKA, new Date(best.t), BEIJING.latitude, BEIJING.longitude)
  near(position.altitude, 90 - Math.abs(BEIJING.latitude - MINTAKA.decDegrees), 0.15, '中天时高度应等于 90° − |纬度 − 赤纬|')
  near(position.azimuth, 180, 0.3, '中天时方位应为正南 180°')
}

// 5. 绝对时刻锚点：2026-01-15 22:00 北京（= 14:00 UTC），参宿四应高挂在东南—南方（一月中旬 Orion 上中天约 22 时）
{
  const date = new Date(Date.UTC(2026, 0, 15, 14, 0, 0))
  const position = astro.starHorizontal(BETELGEUSE, date, BEIJING.latitude, BEIJING.longitude)
  assert(position.altitude > 42, `一月中旬 22 时参宿四应在 42° 以上（实际 ${position.altitude.toFixed(1)}°）`)
  assert(position.azimuth > 100 && position.azimuth < 220, `一月中旬 22 时参宿四应在南方象限（实际方位 ${position.azimuth.toFixed(1)}°）`)
}

// 6. 投影：天顶居中；北方地平线在上方；东方地平线在左侧（仰望星图习惯）
{
  const zenith = astro.projectOnDome({ altitude: 90, azimuth: 0 })
  near(zenith.x, 50, 0.01, '天顶应投影在中心')
  near(zenith.y, 50, 0.01, '天顶应投影在中心')
  const north = astro.projectOnDome({ altitude: 5, azimuth: 0 })
  assert(north.y < 12 && Math.abs(north.x - 50) < 1, `北方低星应落在盘面上缘（实际 x=${north.x.toFixed(1)}, y=${north.y.toFixed(1)}）`)
  const east = astro.projectOnDome({ altitude: 5, azimuth: 90 })
  assert(east.x < 12 && Math.abs(east.y - 50) < 1, `东方低星应落在盘面左缘（实际 x=${east.x.toFixed(1)}, y=${east.y.toFixed(1)}）`)
  const below = astro.projectOnDome({ altitude: -10, azimuth: 0 })
  assert(!below.above, '地平线以下的星应标记为不可见')
}

// 7. 入宿度：参宿三自身应“入参宿 0 度”；参宿四入参宿约 5°47′；觜宿为退化宿不认领
{
  const mintaka = astro.lodgeEntry(MINTAKA.raHours)
  assert(mintaka.lodge === '参' && mintaka.entryDegrees < 0.05, `参宿距星应入参宿 0 度（实际 ${mintaka.lodge} ${mintaka.entryDegrees.toFixed(3)}°）`)
  const betelgeuse = astro.lodgeEntry(BETELGEUSE.raHours)
  assert(betelgeuse.lodge === '参', `参宿四应入参宿（实际 ${betelgeuse.lodge}）`)
  assert(betelgeuse.entryDegrees > 5.7 && betelgeuse.entryDegrees < 5.9, `参宿四入宿度应约 5°47′（实际 ${betelgeuse.entryDegrees.toFixed(3)}°）`)
  const border = astro.lodgeEntry(5.6) // 觜参交界的负宽度地带，应归入参宿而非觜宿
  assert(border.lodge === '参', `觜参交界（RA 5.6h）应归参宿（实际 ${border.lodge}）`)
  const dubhe = astro.lodgeEntry(DUBHE.raHours)
  assert(dubhe.lodge === '翼', `天枢在 J2000 应入翼宿（实际 ${dubhe.lodge}）`)
}

// 8. 去极度 = 90° − 赤纬；格式化输出
{
  near(astro.northPolarDistance(BETELGEUSE.decDegrees), 82.5929, 0.001, '参宿四去极度应为 82°35.6′')
  assert(astro.formatDegrees(82.5929) === '82°36′', `度分格式化（实际 ${astro.formatDegrees(82.5929)}）`)
  assert(astro.formatSignedDegrees(-8.2016) === '−8°12′', `带符号格式化（实际 ${astro.formatSignedDegrees(-8.2016)}）`)
  assert(astro.formatHours(5.9195) === '5h55m', `时分格式化（实际 ${astro.formatHours(5.9195)}）`)
  assert(astro.formatLodgeEntry(BETELGEUSE.raHours) === '入参宿 5°47′', `入宿度字符串（实际 ${astro.formatLodgeEntry(BETELGEUSE.raHours)}）`)
}

// 9. 升起时刻：2026-10-06 晚北京，参宿四应在 20:45–23:15 之间升起
{
  const from = new Date(Date.UTC(2026, 9, 6, 11, 0, 0)) // 北京 10-06 19:00
  const rise = astro.findRiseTime(BETELGEUSE, from, BEIJING.latitude, BEIJING.longitude)
  assert(rise, '今夜 12 小时内应能找到参宿四的升起时刻')
  const minutes = (rise.getTime() - from.getTime()) / 60000
  assert(minutes > 105 && minutes < 255, `参宿四应在 20:45–23:15 之间升起（实际 ${astro.formatClock(rise)}）`)
}

// 10. tonightAt：傍晚时刻落在当天，凌晨时刻自动进位到明天
{
  const base = new Date(2026, 9, 6, 20, 0, 0)
  const evening = astro.tonightAt('20:30', base)
  assert(evening.getDate() === 6 && evening.getHours() === 20, '20:30 应落在当天')
  const dawn = astro.tonightAt('00:30', base)
  assert(dawn.getDate() === 7 && dawn.getHours() === 0, '00:30 应进位到次日')
  assert(astro.formatClock(new Date(2026, 9, 6, 2, 5, 0)) === '02:05', '时刻格式化')
}

// 11. HYG 星表抽检：数量口径、坐标合法性、已知亮星、亮度排序
{
  assert(starfield.length > 2500 && starfield.length < 3200, `星野应为约 2865 颗 ≤5.5 等星（实际 ${starfield.length}）`)
  let brightest = Infinity
  for (const [ra, dec, mag] of starfield) {
    assert(ra >= 0 && ra < 360 && dec >= -90 && dec <= 90 && mag <= 5.51, `星表坐标应在合法范围（${ra}, ${dec}, ${mag}）`)
    brightest = Math.min(brightest, mag)
  }
  assert(brightest < -1, `星表应包含天狼星量级的亮星（最亮 ${brightest}）`)
  const sirius = starfield.find(([, dec, mag]) => dec < -16.5 && dec > -17 && mag < -1)
  assert(sirius && Math.abs(sirius[0] - 101.287) < 0.05, `天狼星赤经应约 101.29°（实际 ${sirius?.[0]}）`)
  assert(starfield[0][2] <= starfield[starfield.length - 1][2], '星表应按亮度从亮到暗排序')
}

// 12. 二十八宿覆盖与距星交叉校验：lodges.ts（HYG 提取）与 astro.ts 宿表（手工整理）互为印证
{
  const lodgeGroups = new Set(lodgeStars.map((star) => star.chineseGroup))
  assert(lodgeGroups.size === 27, `lodges.ts 应覆盖 27 宿（实际 ${lodgeGroups.size}）`)
  assert(demoStars.some((star) => star.chineseGroup === '参宿'), '参宿应在核心星表中，合计 28 宿')
  assert(demoStars.length >= 140, `合并星表应有 140 颗以上（实际 ${demoStars.length}）`)
  const duplicateNames = demoStars.map((star) => star.name).filter((name, index, all) => all.indexOf(name) !== index)
  assert(duplicateNames.length === 0, `星名不应重复（重复：${duplicateNames.join('、') || '无'}）`)
  const duplicateIds = demoStars.map((star) => star.id).filter((id, index, all) => all.indexOf(id) !== index)
  assert(duplicateIds.length === 0, `星点 id 不应重复（重复：${duplicateIds.join('、') || '无'}）`)

  // 距星（各宿首位星）赤经赤纬与 astro.ts 宿表逐宿比对，容差 0.6°
  for (const lodge of astro.lodges) {
    assert(Number.isFinite(lodge.decDegrees), `${lodge.name}宿宿表应有赤纬`)
    const first = lodge.name === '参'
      ? demoStars.find((star) => star.name === '参宿三')
      : lodgeStars.find((star) => star.chineseGroup === `${lodge.name}宿`)
    assert(first, `${lodge.name}宿应存在首位距星`)
    const deltaHours = Math.abs(first.raHours - lodge.raHours)
    assert(deltaHours < 0.04, `${lodge.name}宿距星赤经两表应一致（差 ${(deltaHours * 15).toFixed(3)}°：HYG ${first.raHours}h vs 宿表 ${lodge.raHours}h）`)
    const deltaDec = Math.abs(first.decDegrees - lodge.decDegrees)
    assert(deltaDec < 0.5, `${lodge.name}宿距星赤纬两表应一致（差 ${deltaDec.toFixed(3)}°）`)
  }

  // 每颗宿星的入宿度都应解析出确定的宿
  for (const star of lodgeStars) {
    const entry = astro.lodgeEntry(star.raHours)
    assert(entry.lodge !== '未知', `${star.name} 的入宿度应可解析`)
  }
}

console.log('天文计算校验通过')
console.log('覆盖：恒星时、地平坐标、天穹投影、入宿度、去极度、升起时刻、日期进位、HYG 星表抽检、二十八宿距星交叉校验')

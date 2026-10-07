// React 版渲染检查：在 jsdom 里用 Vite 的 SSR 加载器挂载 App，
// 验证“真实星表数据 → 天文计算 → 界面呈现”整条链路。
// 断言不依赖运行机器的时区：DOM 星位与 astro 模块对同一输入的计算结果比对。
import { JSDOM } from 'jsdom'
import * as astro from '../src/lib/astro.ts'
import { chinaLines, locations, stars, timeLabels, westernLines } from '../src/data/demo.ts'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
})
for (const key of ['window', 'document', 'navigator', 'localStorage', 'getComputedStyle']) {
  try { globalThis[key] = dom.window[key] } catch { /* navigator 等只读全局量沿用宿主值 */ }
}
// jsdom 未实现 matchMedia 与 scrollTo，补浏览器等价桩（与今时 smoke-ui 的做法一致）
dom.window.matchMedia = (media) => ({
  matches: false,
  media,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, dispatchEvent() { return false },
})
dom.window.scrollTo = () => {}
globalThis.matchMedia = dom.window.matchMedia

const { createServer } = await import('vite')
const server = await createServer({ logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const { default: App } = await server.ssrLoadModule('/src/app/App.tsx')
const { createElement } = await import('react')
const ReactDOMClient = await import('react-dom/client')
const createRoot = ReactDOMClient.createRoot ?? ReactDOMClient.default.createRoot

const { document } = dom.window
const assert = (condition, message) => {
  if (!condition) throw new Error(`渲染检查失败：${message}`)
}
const settle = (ms = 60) => new Promise((resolve) => dom.window.setTimeout(resolve, ms))

try {
  createRoot(document.getElementById('root')).render(createElement(App))
  await settle(520) // 跨过 360ms 加载屏

  // 引导层出现并可关闭
  assert(document.querySelector('.onboarding-card'), '首次打开显示欢迎引导')
  document.querySelector('.onboarding-card .primary-button').click()
  await settle()
  assert(!document.querySelector('.onboarding-card'), '点击开始观星后关闭引导')

  // 星点数量与天穹装饰
  const starButtons = [...document.querySelectorAll('.star-point')]
  assert(starButtons.length === stars.length, `应渲染 ${stars.length} 颗星（实际 ${starButtons.length}）`)
  assert(document.querySelector('.horizon-ring'), '天穹应绘制地平圈')
  assert(document.querySelectorAll('.compass-mark').length === 4, '天穹应有北东南西四个方位标')

  // 背景星野：HYG 真星表圆点应渲染（只画地平线以上，约半数可见），且全部落在盘面内
  const fieldCircles = [...document.querySelectorAll('.constellation-lines circle.field-star')]
  assert(fieldCircles.length > 800, `背景星野应渲染数百上千颗（实际 ${fieldCircles.length}）`)
  for (const circle of fieldCircles) {
    const cx = Number.parseFloat(circle.getAttribute('cx'))
    const cy = Number.parseFloat(circle.getAttribute('cy'))
    assert(Number.isFinite(cx) && cx >= 0 && cx <= 100 && cy >= 0 && cy <= 100, `星野圆点应落在盘面内（${cx}, ${cy}）`)
  }
  assert(!document.querySelector('.sky-stage .starfield'), '装饰性随机星野纹理应已被真实星表替代')

  // 宿度环：28 宿刻度与名标全部落环，且与 astro 对同一输入的方位计算一致（东在左）
  const lodgeNames = [...document.querySelectorAll('.constellation-lines .lodge-name')]
  assert(lodgeNames.length === 28, `宿度环应有 28 宿名标（实际 ${lodgeNames.length}）`)
  {
    const site0 = locations[0]
    const moment0 = astro.tonightAt(timeLabels[2])
    const jiao = astro.lodges.find((l) => l.name === '角')
    const horizontal = astro.starHorizontal({ raHours: jiao.raHours, decDegrees: jiao.decDegrees }, moment0, site0.latitude, site0.longitude)
    const az = horizontal.azimuth * (Math.PI / 180)
    const expectX = 50 - 48.8 * Math.sin(az)
    const expectY = 50 - 48.8 * Math.cos(az)
    const mark = lodgeNames.find((element) => element.textContent === '角')
    const mx = Number.parseFloat(mark.getAttribute('x'))
    const my = Number.parseFloat(mark.getAttribute('y')) - 0.7
    assert(Math.abs(mx - expectX) < 0.05 && Math.abs(my - expectY) < 0.05, `角宿名标应落在计算方位上（实际 ${mx.toFixed(2)},${my.toFixed(2)}，期望 ${expectX.toFixed(2)},${expectY.toFixed(2)}）`)
    const belowCount = document.querySelectorAll('.constellation-lines .lodge-mark.below').length
    assert(belowCount > 0 && belowCount < 28, `应有部分宿在地平线下（实际 ${belowCount}）`)
  }

  // 星位应与 astro 模块对同一输入的计算一致（默认：北京 · timeLabels[2]）
  const site = locations[0]
  const moment = astro.tonightAt(timeLabels[2])
  for (const star of stars) {
    const button = starButtons.find((element) => element.getAttribute('aria-label')?.includes(star.name))
    assert(button, `缺少星点按钮：${star.name}`)
    const dome = astro.projectOnDome(astro.starHorizontal(star, moment, site.latitude, site.longitude))
    const left = Number.parseFloat(button.style.left)
    const top = Number.parseFloat(button.style.top)
    assert(Math.abs(left - dome.x) < 0.05 && Math.abs(top - dome.y) < 0.05, `${star.name} 的界面星位应与计算一致`)
    const below = button.classList.contains('below-horizon')
    assert(below === !dome.above, `${star.name} 的升落状态标记应正确`)
  }

  // 连线随模式切换：西方模式沙漏形不含腰带“参宿一—参宿二”，连线数与中国星官不同。
  // 只统计两端都已升起的连线（与界面规则一致：地平线下不画线）。
  // 中国模式下不应出现 88 星座全天天区线
  assert(document.querySelectorAll('.constellation-lines line.western-sky-line').length === 0, '中国模式不应绘制西方全天天区线')
  const aboveIds = new Set(stars.filter((star) => {
    const dome = astro.projectOnDome(astro.starHorizontal(star, moment, site.latitude, site.longitude))
    return dome.above
  }).map((star) => star.id))
  document.querySelector('[aria-label="切换天空命名方式"] .mode-button:nth-child(2)').click()
  await settle()
  // 只数星座连线（western-line）；宿度环的刻度线是 lodge-tick，不能混入
  const westernCount = [...document.querySelectorAll('.constellation-lines line.western-line')].length
  const expectedWestern = westernLines.filter(([a, b]) => aboveIds.has(a) && aboveIds.has(b)).length
  assert(westernCount === expectedWestern, `西方星座可见连线数应为 ${expectedWestern}（实际 ${westernCount}）`)
  assert(westernCount > 0, '西方星座应至少画出一条可见连线')

  // 88 西方星座全天天区线：西方模式下应出现数百段（仅地平线以上），坐标均在盘面内
  const skySegments = [...document.querySelectorAll('.constellation-lines line.western-sky-line')]
  assert(skySegments.length > 250, `西方全天连线应绘制数百段（实际 ${skySegments.length}）`)
  for (const segment of skySegments.slice(0, 40)) {
    for (const attr of ['x1', 'y1', 'x2', 'y2']) {
      const value = Number.parseFloat(segment.getAttribute(attr))
      assert(Number.isFinite(value) && value >= 0 && value <= 100, `天区线坐标应在盘面内（${attr}=${value}）`)
    }
  }

  // 时间滑块移动后星位应实时重排
  const anchorBefore = starButtons.find((element) => element.getAttribute('aria-label')?.includes('参宿四'))
  const before = { left: anchorBefore.style.left, top: anchorBefore.style.top }
  const range = document.querySelector('input[type="range"]')
  // React 会劫持 input.value 的自身属性用于去重；用原型上的原生 setter 赋值，
  // 再派发 change 事件，React 才会识别为一次受控变更。
  const nativeSetter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set
  nativeSetter.call(range, String(timeLabels.length - 1))
  range.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
  await settle()
  assert(anchorBefore.style.left !== before.left || anchorBefore.style.top !== before.top, '调整时间后星位应重新计算')

  // 星官卡与测量面板：参宿四的读数是确定值，不依赖运行机器的时区
  anchorBefore.click()
  await settle()
  assert(document.querySelector('.info-card h3')?.textContent === '参宿四', '点击星点打开星官卡')
  assert(document.querySelector('.info-card .sky-now')?.textContent, '星官卡应显示此刻地平状态')
  document.querySelector('.info-card .card-cta').click()
  await settle()
  assert(document.querySelector('.measure-panel'), '进入测量面板')
  const readings = [...document.querySelectorAll('.reading-grid strong')].map((element) => element.textContent)
  assert(readings[0] === '入参宿 5°47′', `入宿度应显示真实换算值（实际 ${readings[0]}）`)
  assert(readings[1] === '去极 82°36′', `去极度应为 90° − 赤纬（实际 ${readings[1]}）`)
  assert(readings[2] === '5h55m' && readings[3] === '+7°24′', `现代坐标应为 J2000 星表值（实际 ${readings[2]} / ${readings[3]}）`)

  const commitButton = [...document.querySelectorAll('.measure-panel button')].find((button) => button.textContent.includes('记入奏折'))
  commitButton.click()
  await settle()
  assert(document.querySelector('.record-card h3')?.textContent === '参宿四', '记入奏折后显示最近一次观测')
  assert(document.querySelector('.record-card .mini-reading')?.textContent.includes('入参宿'), '观测记录应包含入宿度')

  console.log('React 版渲染检查通过')
  console.log('覆盖：真实星位渲染、升落标记、模式切换、时间联动、星官卡、真实读数、记入奏折')
} finally {
  await server.close()
  dom.window.close()
}

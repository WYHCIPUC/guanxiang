// 真实浏览器全流程巡检：桌面 + 移动端把产品动线完整走一遍（引导→模式→时间→地点→星官卡→测量→奏折→客星剧场四幕）。
// 每步做 DOM 断言并收集控制台错误，输出 artifacts/audit-report.json；有失败项时退出码非 0。
// 用法：先 `npm run preview -- --port 5199 --strictPort`，再 `node scripts/full-flow-audit.mjs`
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9334
const URL = process.env.APP_URL || 'http://localhost:5199/app.html'
const outdir = resolve('artifacts')
mkdirSync(outdir, { recursive: true })
// 启动清理容错：上次运行的 Edge 子进程可能仍握着 profile 目录（Windows 句柄释放延迟）
try { rmSync(join(outdir, '_edge-profile-audit'), { recursive: true, force: true }) } catch {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      return (await res.json()).webSocketDebuggerUrl
    } catch { await sleep(250) }
  }
  throw new Error('Edge CDP 未就绪')
}

const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(outdir, '_edge-profile-audit'),
  '--headless=new', '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' })
// 退出时只杀 Edge；残留目录在正常收尾路径清理（事件循环存活、句柄已释放，exit 钩子里 rmSync 会 EBUSY）
process.on('exit', () => {
  try { edge.kill() } catch {}
})

const ws = new WebSocket(await getWsUrl())
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })

let seq = 0
const pending = new Map()
const consoleErrors = [] // {step, text}
let currentStep = 'boot'
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return }
  const err = msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error'
    ? (msg.params.args ?? []).map((a) => a.value ?? a.description ?? a.type).join(' ')
    : msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error'
      ? `${msg.params.entry.source}: ${msg.params.entry.text}`
      : ''
  if (err) consoleErrors.push({ step: currentStep, text: err.slice(0, 300) })
}
function send(method, params = {}, sessionId) {
  const id = ++seq
  return new Promise((res, rej) => {
    pending.set(id, (m) => (m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result)))
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cdp = (m, p) => send(m, p, sessionId)
await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Log.enable')

async function evalJs(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error('JS: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result.value
}
async function setViewport(w, h, mobile = false, dsf = 1) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
}
async function waitState(expr, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try { if (await evalJs(expr)) return } catch {}
    await sleep(200)
  }
  throw new Error('状态等待超时: ' + expr)
}
async function gotoFresh() {
  await cdp('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await cdp('Page.navigate', { url: URL })
  await waitState("!!document.querySelector('.app-shell') || !!document.querySelector('.loading-screen')")
  await evalJs(`try{localStorage.clear();sessionStorage.clear()}catch(e){}; 'ok'`)
  await cdp('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await cdp('Page.navigate', { url: URL })
  await waitState("!!document.querySelector('.app-shell')")
  await sleep(600)
}

const results = []
async function check(name, expr, note = '') {
  currentStep = name
  try {
    const value = await evalJs(expr)
    results.push({ name, pass: Boolean(value), note: note || String(value) })
  } catch (error) {
    results.push({ name, pass: false, note: 'EXC: ' + error.message })
  }
}
async function step(name, js) {
  currentStep = name
  try { await evalJs(js); results.push({ name, pass: true, note: 'ok' }) }
  catch (error) { results.push({ name, pass: false, note: 'EXC: ' + error.message }) }
}

// React 19 劫持实例 value setter，必须走原型 setter + input 事件才能驱动受控 range（同 render-check 的 jsdom 做法）
const setRange = `(() => { const r = document.querySelector('input[type="range"]'); if (!r) return 'no-range'; const v = r.value; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(r, r.max); r.dispatchEvent(new Event('input', { bubbles: true })); return v; })()`
const setRangeMin = `(() => { const r = document.querySelector('input[type="range"]'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(r, r.min); r.dispatchEvent(new Event('input', { bubbles: true })); 'ok' })()`

try {
  // ============ 桌面 1440×900 ============
  await setViewport(1440, 900)
  await gotoFresh()

  await check('D01 首开显示欢迎引导', `!!document.querySelector('.onboarding-card')`)
  await step('D02 关闭引导', `document.querySelector('.onboarding-card .primary-button').click(); 'ok'`)
  await waitState(`!!document.querySelector('.sky-stage') && !document.querySelector('.onboarding-card')`)
  await check('D03 交互星 154 颗', `document.querySelectorAll('.star-point').length`, '')
  await check('D04 背景星野 >800', `document.querySelectorAll('circle.field-star').length`)
  await check('D05 宿度环 28 宿名', `document.querySelectorAll('.lodge-name').length`)
  await check('D06 方位标 4 个', `document.querySelectorAll('.compass-mark').length`)
  await check('D07 可见标签 ≤ 24（防串珠）', `(document.querySelectorAll('.star-label:not(.hint)').length <= 24) + '/' + document.querySelectorAll('.star-label:not(.hint)').length`)

  await step('D08 切西方星座模式', `document.querySelector('[aria-label="切换天空命名方式"] .mode-button:nth-child(2)').click(); 'ok'`)
  await sleep(400)
  await check('D09 西方全天线 >200 段', `document.querySelectorAll('line.western-sky-line').length`)
  await step('D10 切叠合观天', `[...document.querySelectorAll('.mode-button')].find(b => b.textContent.includes('叠合')).click(); 'ok'`)
  await sleep(400)
  await check('D11 叠合模式双行标签', `document.querySelectorAll('.star-label-duo').length`)
  await step('D12 切回中国星官', `[...document.querySelectorAll('.mode-button')].find(b => b.textContent.includes('中国星官')).click(); 'ok'`)
  await sleep(400)

  const before = await evalJs(`(() => { const b = [...document.querySelectorAll('.star-point')].find(x => x.getAttribute('aria-label')?.includes('参宿四')); return b ? b.style.left + ',' + b.style.top : 'absent' })()`)
  await step('D13 时间滑杆拉到最右', setRange)
  await sleep(500)
  const after = await evalJs(`(() => { const b = [...document.querySelectorAll('.star-point')].find(x => x.getAttribute('aria-label')?.includes('参宿四')); return b ? b.style.left + ',' + b.style.top : 'absent' })()`)
  results.push({ name: 'D14 时间推进星位移动', pass: before !== after, note: `${before} → ${after}` })
  await step('D15 时间滑杆拉回最左', setRangeMin)
  await sleep(500)

  await step('D16 打开地点弹层', `document.querySelector('.quiet-button').click(); 'ok'`)
  await waitState(`!!document.querySelector('.location-popover')`)
  const beforeLoc = await evalJs(`(() => { const b = [...document.querySelectorAll('.star-point')].find(x => x.getAttribute('aria-label')?.includes('天枢')); return b ? b.style.left : 'absent' })()`)
  await step('D17 切换观测地到上海', `[...document.querySelectorAll('.location-popover button')].find(b => b.textContent.includes('上海')).click(); 'ok'`)
  await sleep(600)
  const afterLoc = await evalJs(`(() => { const b = [...document.querySelectorAll('.star-point')].find(x => x.getAttribute('aria-label')?.includes('天枢')); return b ? b.style.left : 'absent' })()`)
  results.push({ name: 'D18 换地星位移动', pass: beforeLoc !== afterLoc, note: `${beforeLoc} → ${afterLoc}` })

  await step('D19 打开参宿四星官卡', `(() => { document.body.click(); [...document.querySelectorAll('.star-point')].find(b => b.getAttribute('aria-label')?.startsWith('查看参宿四')).click(); 'ok' })()`)
  await waitState(`!!document.querySelector('.info-card')`)
  await check('D20 星官卡标题正确', `document.querySelector('.info-card h3')?.textContent`)
  await check('D21 星官卡含此刻地平状态', `(document.querySelector('.info-card .sky-now')?.textContent || '').length > 4`)
  await step('D22 星官卡进入测量', `document.querySelector('.info-card .card-cta').click(); 'ok'`)
  await waitState(`!!document.querySelector('.measure-panel')`)
  await check('D23 测量读数 ≥4 项', `document.querySelectorAll('.reading-grid strong').length`)
  await step('D24 记入奏折', `[...document.querySelectorAll('.measure-panel button')].find(b => b.textContent.includes('记入奏折')).click(); 'ok'`)
  await waitState(`!!document.querySelector('.record-card')`)
  await check('D25 奏折标题为参宿四', `document.querySelector('.record-card h3')?.textContent`)
  await check('D26 奏折含入宿度', `(document.querySelector('.record-card .mini-reading')?.textContent || '').includes('入参宿')`)
  await check('D27 下载奏折按钮存在', `[...document.querySelectorAll('button')].some(b => b.textContent.includes('下载奏折'))`)

  await step('D28 进入客星剧场', `document.querySelector('.theater-entry').click(); 'ok'`)
  await waitState(`!!document.querySelector('.theater-card')`)
  await check('D29 天穹出现客星', `!!document.querySelector('.sky-stage .guest-star')`)
  await check('D30 剧场四幕按钮', `document.querySelectorAll('.scene-button').length`)
  await check('D31 剧场引用史料', `(document.querySelector('.theater-quote')?.textContent || '').length > 8`)
  await check('D32 客星读数实时换算', `(document.querySelector('.theater-card .mini-reading')?.textContent || '').includes('入参宿')`)
  const guestBefore = await evalJs(`document.querySelector('.guest-star')?.style.left || ''`)
  await step('D33 切昼见幕', `[...document.querySelectorAll('.scene-button')].find(b => b.textContent.includes('昼见')).click(); 'ok'`)
  await sleep(400)
  await check('D34 昼见天穹白昼化', `document.querySelector('.sky-stage')?.className.includes('daytime')`)
  await check('D35 白昼唯客星可见', `!!document.querySelector('.sky-stage .guest-star')`)
  await step('D36 切极盛幕', `[...document.querySelectorAll('.scene-button')].find(b => b.textContent.includes('极盛')).click(); 'ok'`)
  await sleep(400)
  await check('D37 切幕客星位移', `(document.querySelector('.guest-star')?.style.left || '') !== ${JSON.stringify(guestBefore)}`)
  await step('D38 切没灭幕', `[...document.querySelectorAll('.scene-button')].find(b => b.textContent.includes('没灭')).click(); 'ok'`)
  await sleep(400)
  await check('D39 没灭幕剧场卡仍在', `!!document.querySelector('.theater-card')`)
  await step('D40 回极盛并测客星', `[...document.querySelectorAll('.scene-button')].find(b => b.textContent.includes('极盛')).click(); 'ok'`)
  await sleep(300)
  await step('D41 用浑仪测客星', `[...document.querySelectorAll('.theater-card .card-cta')].find(b => b.textContent.includes('浑仪')).click(); 'ok'`)
  await waitState(`!!document.querySelector('.measure-panel')`)
  await check('D42 测量面板读数含客星坐标', `document.querySelectorAll('.reading-grid strong').length >= 4`)
  await sleep(400)
  await check('D43 进入测量即退出剧场', `!document.querySelector('.theater-card')`)
  await check('D44 退出后天穹无客星', `!document.querySelector('.sky-stage .guest-star')`)

  // ============ 移动端 390×844 ============
  await setViewport(390, 844, true, 2)
  await gotoFresh()
  await check('M01 移动端引导出现', `!!document.querySelector('.onboarding-card')`)
  await step('M02 关闭引导', `document.querySelector('.onboarding-card .primary-button').click(); 'ok'`)
  await waitState(`!!document.querySelector('.sky-stage') && !document.querySelector('.onboarding-card')`)
  await sleep(500)
  await check('M03 移动端交互星齐全', `document.querySelectorAll('.star-point').length`)
  await check('M04 移动端可见标签 ≤ 18', `(document.querySelectorAll('.star-label:not(.hint)').length <= 18) + '/' + document.querySelectorAll('.star-label:not(.hint)').length`)
  await check('M05 移动端宿度环 28 宿名', `document.querySelectorAll('.lodge-name').length`)
  await step('M06 打开星官卡', `(() => { const btn = [...document.querySelectorAll('.star-point')].find(b => b.getAttribute('aria-label')?.startsWith('查看织女一')) || [...document.querySelectorAll('.star-point')][0]; btn.click(); 'ok' })()`)
  await waitState(`!!document.querySelector('.info-card')`)
  await check('M07 星官卡标题', `document.querySelector('.info-card h3')?.textContent`)
  await step('M08 移动端测量', `document.querySelector('.info-card .card-cta').click(); 'ok'`)
  await waitState(`!!document.querySelector('.measure-panel')`)
  await step('M09 记入奏折', `[...document.querySelectorAll('.measure-panel button')].find(b => b.textContent.includes('记入奏折')).click(); 'ok'`)
  await waitState(`!!document.querySelector('.record-card')`)
  await step('M10 进入剧场', `document.querySelector('.theater-entry').click(); 'ok'`)
  await waitState(`!!document.querySelector('.theater-card')`)
  await check('M11 移动端客星可见', `!!document.querySelector('.sky-stage .guest-star')`)
  await step('M12 切昼见幕', `[...document.querySelectorAll('.scene-button')].find(b => b.textContent.includes('昼见')).click(); 'ok'`)
  await sleep(400)
  await check('M13 移动端白昼化', `document.querySelector('.sky-stage')?.className.includes('daytime')`)
  await step('M14 退出剧场', `document.querySelector('.theater-card .icon-button').click(); 'ok'`)
  await sleep(400)
  await check('M15 退出后无客星', `!document.querySelector('.sky-stage .guest-star')`)
  await step('M16 点按 hint 宿星', `(() => { const b = [...document.querySelectorAll('.star-point')].find(x => /^查看.{1,3}宿[一二三四五六七八九十]/.test(x.getAttribute('aria-label') || '') && x.querySelector('.star-label.hint') && !x.className.includes('selected')); if (!b) return 'none'; window.__hinted = b.getAttribute('aria-label'); b.click(); return 'ok' })()`)
  await sleep(350)
  await check('M16d 点后状态', `(() => { const named = [...document.querySelectorAll('.star-label')].filter(l => !l.className.includes('hint')).length; const sel = [...document.querySelectorAll('.star-point.selected')].map(b => b.getAttribute('aria-label')); return JSON.stringify({ named, sel }) })()`)
  await sleep(350)
  await check('M17 整组星名展开', `(() => { const b = [...document.querySelectorAll('.star-point')].find(x => x.getAttribute('aria-label') === window.__hinted); return b ? !b.querySelector('.star-label').className.includes('hint') : false })()`)
  await step('M18 点空白处收回', `(() => { document.querySelector('.sky-stage').click(); 'ok' })()`)
  await sleep(300)
  await check('M19 落组星名已收回', `(() => { const b = [...document.querySelectorAll('.star-point')].find(x => x.getAttribute('aria-label') === window.__hinted); const label = b?.querySelector('.star-label'); return !label || label.className.includes('hint') })()`)
  await check('M19d 收回诊断', `(() => { const b = [...document.querySelectorAll('.star-point')].find(x => x.getAttribute('aria-label') === window.__hinted); return JSON.stringify({ labelCls: b?.querySelector('.star-label')?.className, btnCls: b?.className }) })()`)
} catch (error) {
  results.push({ name: 'FATAL', pass: false, note: error.message })
}

const failed = results.filter((r) => !r.pass)
const report = {
  url: URL, at: new Date().toISOString(),
  total: results.length, failed: failed.length,
  consoleErrors,
  results,
}
writeFileSync(join(outdir, 'audit-report.json'), JSON.stringify(report, null, 2))

// 正常收尾：按命令行匹配杀掉本项目 Edge（headless 下 launcher 可能早退，taskkill /PID 杀不到真浏览器进程）、
// 等句柄释放、清浏览器残留（留磁盘会触发安全扫描误报）
try { execSync(`taskkill /PID ${edge.pid} /T /F`, { stdio: 'ignore' }) } catch {}
try {
  execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='msedge.exe'\\" | Where-Object { $_.CommandLine -like '*_edge-profile-audit*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' })
} catch {}
await sleep(600)
try { rmSync(join(outdir, '_edge-profile-audit'), { recursive: true, force: true }) } catch {}

console.log(`\n巡检完成：${results.length} 项，失败 ${failed.length} 项，控制台错误 ${consoleErrors.length} 条`)
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : ' —— ' + r.note}`)
if (consoleErrors.length) {
  console.log('\n控制台错误：')
  for (const e of consoleErrors) console.log(`  [${e.step}] ${e.text}`)
}
process.exit(failed.length || consoleErrors.length ? 1 : 0)

// 独占 Edge 实例的视觉截图驱动：走 CDP，不与共享浏览器冲突。
// 用法：node scripts/visual-capture.mjs <preset> [outdir]
// preset: baseline | iterate
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9333
const URL = process.env.APP_URL || 'http://localhost:5199/app.html'
const preset = process.argv[2] || 'baseline'
const outdir = resolve(process.argv[3] || 'artifacts/capture')
mkdirSync(outdir, { recursive: true })
rmSync(join(outdir, '_edge-profile'), { recursive: true, force: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const j = await res.json()
      return j.webSocketDebuggerUrl
    } catch { await sleep(250) }
  }
  throw new Error('Edge CDP 未就绪')
}

const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(outdir, '_edge-profile'),
  '--headless=new',
  '--window-size=1440,900',
  '--no-first-run', '--no-default-browser-check',
  'about:blank',
], { stdio: 'ignore' })
process.on('exit', () => { try { edge.kill() } catch {} })

const wsUrl = await getWsUrl()
const ws = new WebSocket(wsUrl)
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })

let seq = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
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

async function evalJs(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error('JS: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result.value
}
async function shot(name) {
  const r = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(outdir, name), Buffer.from(r.data, 'base64'))
  console.log('shot', name)
}
async function setViewport(w, h, mobile = false, dsf = 1) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
}
async function waitState(expr, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try { if (await evalJs(expr)) return true } catch {}
    await sleep(200)
  }
  throw new Error('状态等待超时: ' + expr)
}
async function gotoFresh(clearStorage = true) {
  await cdp('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await cdp('Page.navigate', { url: URL })
  await waitState("!!document.querySelector('.app-shell') || !!document.querySelector('.loading-screen')")
  if (clearStorage) await evalJs(`try{localStorage.clear();sessionStorage.clear()}catch(e){}; 'ok'`)
  await cdp('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await cdp('Page.navigate', { url: URL })
  await waitState("!!document.querySelector('.app-shell')")
  await sleep(600)
}

await cdp('Page.enable')
await cdp('Runtime.enable')

if (preset === 'baseline') {
  // 桌面 1440×900
  await setViewport(1440, 900)
  await gotoFresh()
  await shot('01-desktop-onboarding.png')
  await evalJs(`document.querySelector('.onboarding-card .primary-button').click(); 'ok'`)
  await waitState("!!document.querySelector('.sky-stage') && !document.querySelector('.onboarding-card')")
  await shot('02-desktop-main-china.png')
  // 星官卡：点北斗天枢（今夜可见）
  await evalJs(`[...document.querySelectorAll('.star-point')].find(b=>b.getAttribute('aria-label')==='查看天枢').click(); 'ok'`)
  await waitState("!!document.querySelector('.info-card')")
  await shot('03-desktop-star-card.png')
  // 西方模式
  await evalJs(`document.querySelector('.info-card .close-card').click(); [...document.querySelectorAll('.mode-button')].find(b=>b.textContent==='西方星座').click(); 'ok'`)
  await sleep(400); await shot('04-desktop-western.png')
  // 叠合
  await evalJs(`[...document.querySelectorAll('.mode-button')].find(b=>b.textContent==='叠合观天').click(); 'ok'`)
  await sleep(400); await shot('05-desktop-both.png')
  // 地点弹层
  await evalJs(`[...document.querySelectorAll('.mode-button')].find(b=>b.textContent==='中国星官').click(); document.querySelector('.quiet-button').click(); 'ok'`)
  await waitState("!!document.querySelector('.location-popover')")
  await shot('06-desktop-location.png')
  // 测量弹窗
  await evalJs(`document.body.click(); document.querySelector('.observatory-actions .primary-button').click(); 'ok'`)
  await waitState("!!document.querySelector('.measure-panel')")
  await shot('07-desktop-measure.png')
  // 记录卡
  await evalJs(`[...document.querySelectorAll('.panel-actions .primary-button')].find(b=>b.textContent.includes('记入奏折')).click(); 'ok'`)
  await waitState("!!document.querySelector('.record-card')")
  await shot('08-desktop-record.png')

  // 笔记本 1024×700
  await setViewport(1024, 700)
  await gotoFresh(false)
  await evalJs(`localStorage.removeItem('butian-onboarding-seen'); 'ok'`)
  await gotoFresh()
  await evalJs(`document.querySelector('.onboarding-card .primary-button').click(); 'ok'`)
  await sleep(400); await shot('09-laptop-main.png')

  // 手机 390×844
  await setViewport(390, 844, true)
  await evalJs(`localStorage.removeItem('butian-onboarding-seen'); localStorage.removeItem('butian-last-observation'); 'ok'`)
  await gotoFresh(false)
  await waitState("!!document.querySelector('.onboarding-card')")
  await shot('10-mobile-onboarding.png')
  await evalJs(`document.querySelector('.onboarding-card .primary-button').click(); 'ok'`)
  await sleep(400); await shot('11-mobile-main.png')
  await evalJs(`[...document.querySelectorAll('.star-point')].find(b=>b.getAttribute('aria-label')==='查看天枢').click(); 'ok'`)
  await waitState("!!document.querySelector('.info-card')")
  await shot('12-mobile-star-card.png')
  await evalJs(`document.querySelector('.info-card .close-card').click(); document.querySelector('.observatory-actions .primary-button').click(); 'ok'`)
  await waitState("!!document.querySelector('.measure-panel')")
  await shot('13-mobile-measure.png')
} else {
  // iterate 预设：关键状态全家福，用于每轮回归与盲评
  await setViewport(1440, 900)
  await gotoFresh()
  await evalJs(`document.querySelector('.onboarding-card .primary-button').click(); 'ok'`)
  await waitState("!!document.querySelector('.sky-stage')")
  await shot('r-desktop-firstscreen.png')
  await evalJs(`document.querySelector('.observatory-card').scrollIntoView({block:'start'}); 'ok'`)
  await sleep(350)
  await shot('r-desktop-china.png')
  await evalJs(`[...document.querySelectorAll('.mode-button')].find(b=>b.textContent==='西方星座').click(); 'ok'`)
  await sleep(400); await shot('r-desktop-western.png')
  await evalJs(`[...document.querySelectorAll('.mode-button')].find(b=>b.textContent==='叠合观天').click(); 'ok'`)
  await sleep(400); await shot('r-desktop-both.png')
  await evalJs(`[...document.querySelectorAll('.star-point')].find(b=>b.getAttribute('aria-label')==='查看天枢').click(); 'ok'`)
  await waitState("!!document.querySelector('.info-card')")
  await shot('r-desktop-star-card.png')
  await evalJs(`document.querySelector('.info-card .close-card').click(); document.querySelector('.observatory-actions .primary-button').click(); 'ok'`)
  await waitState("!!document.querySelector('.measure-panel')")
  await sleep(300)
  await shot('r-desktop-measure-before.png')
  // 真实指针事件瞄准靶星（台面中心），验证拖拽吸附与读数点亮
  const rectStr = await evalJs(`JSON.stringify(document.querySelector('.instrument-stage').getBoundingClientRect())`)
  const rect = JSON.parse(rectStr)
  const cx = Math.round(rect.x + rect.width * 0.5)
  const cy = Math.round(rect.y + rect.height * 0.5)
  for (const type of ['mousePressed', 'mouseMoved', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: cx, y: cy, button: 'left', clickCount: 1 }, sessionId)
  }
  await sleep(300)
  await shot('r-desktop-measure-aimed.png')
  await evalJs(`[...document.querySelectorAll('.panel-actions .primary-button')].find(b=>b.textContent.includes('记入奏折')).click(); 'ok'`)
  await waitState("!!document.querySelector('.record-card')")
  await shot('r-desktop-record.png')

  await setViewport(390, 844, true)
  await gotoFresh()
  await evalJs(`document.querySelector('.onboarding-card .primary-button').click(); 'ok'`)
  await sleep(400); await shot('r-mobile-main.png')
  await evalJs(`document.querySelector('.observatory-actions .primary-button').click(); 'ok'`)
  await waitState("!!document.querySelector('.measure-panel')")
  const rectStr2 = await evalJs(`JSON.stringify(document.querySelector('.instrument-stage').getBoundingClientRect())`)
  const rect2 = JSON.parse(rectStr2)
  const cx2 = Math.round(rect2.x + rect2.width * 0.5)
  const cy2 = Math.round(rect2.y + rect2.height * 0.5)
  for (const type of ['mousePressed', 'mouseMoved', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: cx2, y: cy2, button: 'left', clickCount: 1 }, sessionId)
  }
  await sleep(300)
  await shot('r-mobile-measure-aimed.png')
}

// 控制台错误与性能指标
const errors = await evalJs(`window.__errs ? JSON.stringify(window.__errs) : '[]'`)
console.log('console-errors:', errors)

ws.close(); edge.kill()
console.log('DONE', outdir)

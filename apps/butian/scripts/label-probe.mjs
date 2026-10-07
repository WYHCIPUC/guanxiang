// DOM 探针：核查北斗七星标签的真实渲染状态（避开截图目测的误差）
import { spawn } from 'node:child_process'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9334
const URL = 'http://localhost:5199/app.html'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--user-data-dir=C:/Users/1/AppData/Local/Temp/butian-probe', '--headless=new', '--window-size=1440,900', '--no-first-run', 'about:blank'], { stdio: 'ignore' })
process.on('exit', () => { try { edge.kill() } catch {} })

let wsUrl
for (let i = 0; i < 40; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; break } catch { await sleep(250) }
}
const ws = new WebSocket(wsUrl)
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
let seq = 0
const pending = new Map()
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const id = ++seq
  pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)))
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
})
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cdp = (m, p) => send(m, p, sessionId)
await cdp('Page.enable'); await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp('Page.navigate', { url: URL })
for (let i = 0; i < 30; i++) { try { if (await evalJs("!!document.querySelector('.sky-stage')")) break } catch {} await sleep(200) }
await sleep(500)
await evalJs(`document.querySelector('.onboarding-card .primary-button')?.click(); 'ok'`)
await sleep(400)

const report = await evalJs(`JSON.stringify([...document.querySelectorAll('.star-point')].slice(0, 40).map(b => {
  const label = b.querySelector('.star-label, .star-label-duo')
  const cs = label ? getComputedStyle(label) : null
  const r = b.getBoundingClientRect()
  const stage = document.querySelector('.sky-stage').getBoundingClientRect()
  return {
    aria: b.getAttribute('aria-label'),
    x: b.style.left, y: b.style.top,
    hasLabel: !!label,
    hint: label ? label.className.includes('hint') : null,
    opacity: cs ? cs.opacity : null,
    starTopPx: Math.round(r.top - stage.top),
    labelBelow: label ? Math.round(label.getBoundingClientRect().bottom - stage.top) : null,
  }
}))`, 'JSON.parse')
console.log(report)
// 各模式计数
for (const mode of ['中国星官', '西方星座', '叠合观天']) {
  await evalJs(`[...document.querySelectorAll('.mode-button')].find(b=>b.textContent==='${mode}')?.click(); 'ok'`)
  await sleep(350)
  console.log(mode, await evalJs(`JSON.stringify({visibleLabels: [...document.querySelectorAll('.star-label, .star-label-duo')].filter(l=>getComputedStyle(l).opacity!=='0').length})`))
}
ws.close(); edge.kill()

async function evalJs(expr, parse) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return parse ? r.result.value : r.result.value
}

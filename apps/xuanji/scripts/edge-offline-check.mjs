import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { access, mkdir, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function stopProcess(process) {
  if (!process || process.exitCode !== null) return
  const closed = new Promise((resolve) => process.once('close', resolve))
  process.kill()
  await Promise.race([closed, sleep(3000)])
}

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function waitForHttp(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await sleep(100)
  }
  throw new Error(`服务器未在规定时间内就绪：${url}`)
}

async function findEdge() {
  const roots = [
    'C:/Program Files (x86)/Microsoft/Edge/Application',
    'C:/Program Files/Microsoft/Edge/Application',
  ]
  const versioned = []
  for (const root of roots) {
    try {
      const entries = await readdir(root, { withFileTypes: true })
      for (const entry of entries) if (entry.isDirectory() && /^\d/.test(entry.name)) versioned.push(join(root, entry.name, 'msedge.exe'))
    } catch {}
  }
  const candidates = [
    process.env.XUANJI_EDGE,
    ...versioned,
    ...roots.map((root) => join(root, 'msedge.exe')),
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {}
  }
  return null
}

async function json(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}

class CdpClient {
  constructor(socketUrl) {
    this.socketUrl = socketUrl
    this.nextId = 0
    this.pending = new Map()
    this.listeners = new Map()
  }

  async connect() {
    this.socket = new WebSocket(this.socketUrl)
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result)
        return
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params)
    })
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', () => reject(new Error('无法连接 Edge DevTools Protocol')), { once: true })
    })
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  once(method, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`等待 ${method} 超时`)), timeoutMs)
      const listener = (params) => {
        clearTimeout(timer)
        const listeners = this.listeners.get(method) || []
        this.listeners.set(method, listeners.filter((item) => item !== listener))
        resolve(params)
      }
      this.listeners.set(method, [...(this.listeners.get(method) || []), listener])
    })
  }

  async evaluate(expression, awaitPromise = false) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '页面脚本执行失败')
    return result.result?.value
  }

  close() { this.socket?.close() }
}

async function main() {
  const edge = await findEdge()
  if (!edge) {
    console.log('SKIP  未找到 Microsoft Edge；真实离线检查需在安装 Edge 的电脑上运行。')
    return
  }

  const serverPort = await freePort()
  const debugPort = await freePort()
  const origin = `http://127.0.0.1:${serverPort}`
  const profileDir = join(tmpdir(), `xuanji-edge-offline-${process.pid}-${Date.now()}`)
  await mkdir(profileDir, { recursive: true })
  const server = spawn(process.execPath, ['scripts/server.mjs', '--port', String(serverPort)], { stdio: 'ignore', windowsHide: true })
  const browser = spawn(edge, [
    '--headless=new', '--disable-gpu', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`, '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profileDir}`, `${origin}/`,
  ], { stdio: 'ignore', windowsHide: true })
  let client

  try {
    await waitForHttp(`${origin}/`)
    let version
    for (let i = 0; i < 40; i += 1) {
      try { version = await json(`http://127.0.0.1:${debugPort}/json/version`); break } catch { await sleep(100) }
    }
    if (!version?.webSocketDebuggerUrl) throw new Error('Edge DevTools Protocol 未启动')
    client = new CdpClient(version.webSocketDebuggerUrl)
    await client.connect()
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Network.enable')
    await client.send('ServiceWorker.enable')
    await client.once('Page.loadEventFired').catch(() => {})
    const registration = await client.evaluate("navigator.serviceWorker.ready.then((r) => ({scope:r.scope, state:r.active?.state || null}))", true)
    if (!registration?.scope || registration.state !== 'activated') throw new Error(`Service Worker 未激活：${JSON.stringify(registration)}`)
    console.log('PASS  Edge 首次在线打开并激活 Service Worker')

    const reloadReady = client.once('Page.loadEventFired')
    await client.send('Page.reload', { ignoreCache: true })
    await reloadReady
    const controlled = await client.evaluate('Boolean(navigator.serviceWorker.controller)')
    if (!controlled) throw new Error('刷新后页面没有被 Service Worker 控制')
    console.log('PASS  刷新后页面由 Service Worker 控制')

    await client.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
    const offlineReady = client.once('Page.loadEventFired')
    await client.send('Page.reload', { ignoreCache: true })
    await offlineReady
    const pageCheck = await client.evaluate("({title:document.title, hasRoot:Boolean(document.querySelector('#app')), hasStart:document.body.innerText.includes('开始观盘')})")
    if (!pageCheck?.hasRoot || !pageCheck.hasStart) throw new Error(`离线页面内容不完整：${JSON.stringify(pageCheck)}`)
    console.log('PASS  Edge 离线刷新仍加载页面、样式入口和核心文案')

    const missingResource = await client.evaluate("fetch('/src/missing.js').then((r) => ({ok:r.ok,status:r.status,type:r.type,contentType:r.headers.get('content-type')})).catch((e) => ({error:String(e)}))", true)
    if (missingResource?.contentType?.includes('text/html')) throw new Error('离线缺失脚本被错误替换成 HTML')
    if (!missingResource?.error && missingResource?.ok) throw new Error(`缺失脚本不应成功：${JSON.stringify(missingResource)}`)
    console.log('PASS  Edge 离线缺失脚本保持失败，不伪装成 HTML')
  } finally {
    client?.close()
    await stopProcess(browser)
    await stopProcess(server)
    try { await rm(profileDir, { recursive: true, force: true }) } catch { console.warn(`WARN  Edge 临时目录仍被占用，已保留：${profileDir}`) }
  }
}

main().catch((error) => { console.error(`UNVERIFIED  ${error.message}`); process.exitCode = 2 })

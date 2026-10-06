import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile('sw.js', 'utf8')
const handlers = {}
const SWResponse = globalThis.Response || class TestResponse {
  constructor(body = '', options = {}) { this.body = String(body); this.status = options.status || 200; this.type = options.type || 'default' }
  async text() { return this.body }
  static error() { return new TestResponse('', { status: 0, type: 'error' }) }
}
const cacheStore = new Map([['./index.html', new SWResponse('<!doctype html><title>fallback</title>')]])
const cache = {
  addAll: async (paths) => { for (const path of paths) cacheStore.set(path, new SWResponse(path)) },
  match: async (request) => cacheStore.get(typeof request === 'string' ? request : request?.url),
  put: async (request, response) => { cacheStore.set(typeof request === 'string' ? request : request.url, response) },
}
const context = {
  Response: SWResponse,
  fetch: async () => { throw new Error('offline') },
  caches: {
    open: async () => cache,
    match: cache.match,
    keys: async () => ['xuanji-static-old'],
    delete: async () => true,
  },
  self: {
    addEventListener: (type, handler) => { handlers[type] = handler },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  },
}
vm.runInNewContext(source, context, { filename: 'sw.js' })

const installEvent = { waitUntil: (promise) => { installEvent.promise = promise } }
handlers.install(installEvent)
await installEvent.promise
if (!cacheStore.has('./src/main.js') || !cacheStore.has('./assets/icon.svg')) throw new Error('install did not cache the app shell')
cacheStore.set('./index.html', new SWResponse('fallback'))

async function fetchThroughWorker(mode, url) {
  const event = { request: { method: 'GET', mode, url }, respondWith: (promise) => { event.response = promise } }
  handlers.fetch(event)
  return event.response
}

const navigationResponse = await fetchThroughWorker('navigate', 'http://127.0.0.1:4173/missing-page')
if (navigationResponse.status !== 200 || !(await navigationResponse.text()).includes('fallback')) throw new Error('navigation failure did not fall back to index')

const scriptResponse = await fetchThroughWorker('same-origin', 'http://127.0.0.1:4173/src/missing.js')
if (scriptResponse.type !== 'error') throw new Error('non-navigation failure was not preserved as an error')

console.log('Service Worker behavior check passed: install shell, navigation fallback, non-navigation error')

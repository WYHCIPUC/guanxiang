import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, relative, extname } from 'node:path'
import { get } from 'node:http'

function request(path, target) {
  const url = typeof target === 'string'
    ? (path === '/' ? target : new URL(path.replace(/^\/+/, ''), target.endsWith('/') ? target : `${target}/`).href)
    : `http://127.0.0.1:${target}${path}`
  return new Promise((resolve, reject) => {
    const req = get(url, (response) => {
      response.resume()
      response.once('end', () => resolve(response.statusCode))
    })
    req.once('error', reject)
  })
}

const externalBase = process.env.XUANJI_HTTP_BASE?.replace(/\/$/, '')
const root = resolve(process.cwd())
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml' }
const server = externalBase ? null : createServer(async (request, response) => {
  if (request.method !== 'GET') { response.writeHead(405); response.end(); return }
  const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname)
  const candidate = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (relative(root, candidate).startsWith('..')) { response.writeHead(403); response.end(); return }
  try {
    const body = await readFile(candidate)
    response.writeHead(200, { 'Content-Type': contentTypes[extname(candidate)] || 'application/octet-stream' })
    response.end(body)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})
const port = externalBase ? null : await new Promise((resolvePort, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', () => resolvePort(server.address().port))
})
const target = externalBase || port
const paths = ['/', '/src/main.js', '/src/styles.css', '/src/core/profile.js', '/src/data/stars.js', '/src/data/solar-terms.js', '/sw.js', '/manifest.webmanifest', '/assets/icon.svg']

try {
  let ready = false
  for (let attempt = 0; attempt < 20 && !ready; attempt += 1) {
    try { ready = (await request('/', target)) === 200 } catch { await new Promise((resolve) => setTimeout(resolve, 100)) }
  }
  if (!ready) throw new Error('静态服务器未能启动')
  for (const path of paths) {
    const status = await request(path, target)
    if (status !== 200) throw new Error(`${path} returned ${status}`)
    console.log(`PASS  ${path} ${status}`)
  }
  console.log(`\nHTTP check passed: ${paths.length} resources`)
} finally {
  if (server) await new Promise((resolveClose) => server.close(resolveClose))
}

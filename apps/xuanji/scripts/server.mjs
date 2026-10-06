import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, relative, resolve, sep } from 'node:path'

const root = resolve(process.cwd())
const portArgumentIndex = process.argv.indexOf('--port')
const requestedPort = portArgumentIndex >= 0 ? process.argv[portArgumentIndex + 1] : process.env.PORT
const port = Number(requestedPort || 4173)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('端口必须是1到65535之间的整数')

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

function safePath(urlValue) {
  let pathname
  try { pathname = decodeURIComponent(new URL(urlValue || '/', 'http://127.0.0.1').pathname) } catch { return null }
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const candidate = resolve(root, relativePath)
  const relativeCandidate = relative(root, candidate)
  if (relativeCandidate === '..' || relativeCandidate.startsWith(`..${sep}`) || relativeCandidate.includes(`..${sep}`)) return null
  return candidate
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end()
    return
  }
  const filePath = safePath(request.url)
  if (!filePath) {
    response.writeHead(400)
    response.end('Bad request')
    return
  }
  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('not a file')
    const headers = {
      'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    }
    if (request.method === 'HEAD') {
      response.writeHead(200, headers)
      response.end()
      return
    }
    const body = await readFile(filePath)
    response.writeHead(200, { ...headers, 'Content-Length': body.byteLength })
    response.end(body)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not found')
  }
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用，请关闭旧服务或使用 --port 指定其他端口。`)
  } else console.error(error.message)
  process.exitCode = 1
})

server.listen(port, '127.0.0.1', () => {
  console.log(`璇玑已启动：http://127.0.0.1:${port}/`)
  console.log('保持此窗口打开；关闭窗口即可停止服务。')
})

function stop() {
  server.closeAllConnections?.()
  server.close(() => process.exit(0))
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)

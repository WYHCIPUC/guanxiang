const { app, BrowserWindow, net, protocol } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

// The renderer uses a stable, local origin so localStorage survives restarts.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'xuanji',
    privileges: { standard: true, secure: true, supportFetchAPI: true, allowServiceWorkers: false },
  },
])

const projectRoot = path.resolve(__dirname, '..')

function resolveLocalFile(requestUrl) {
  const request = new URL(requestUrl)
  const relativePath = decodeURIComponent(request.pathname).replace(/^\/+/, '') || 'index.html'
  const target = path.resolve(projectRoot, relativePath)
  const relativeTarget = path.relative(projectRoot, target)
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) return null
  return target
}

function registerLocalProtocol() {
  protocol.handle('xuanji', (request) => {
    const target = resolveLocalFile(request.url)
    if (!target) return new Response('Bad request', { status: 400 })
    return net.fetch(pathToFileURL(target).toString())
  })
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 860,
    minHeight: 640,
    show: false,
    title: '璇玑 · 数字观象台',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  })

  window.once('ready-to-show', () => window.show())
  // Alpha 版本不打开外部应用或网页；以后若要加入导出/反馈外链，必须单独审核。
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('xuanji://')) event.preventDefault()
  })
  window.loadURL('xuanji://bundle/index.html')
  return window
}

app.whenReady().then(() => {
  registerLocalProtocol()
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

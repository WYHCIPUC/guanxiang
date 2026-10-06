import { access, readFile } from 'node:fs/promises'

const files = ['desktop/main.cjs', 'desktop/preload.cjs', 'desktop/README.md', 'docs/desktop-client-plan.md']
for (const file of files) await access(file)

const [main, preload, plan, packageJson] = await Promise.all([
  readFile('desktop/main.cjs', 'utf8'),
  readFile('desktop/preload.cjs', 'utf8'),
  readFile('docs/desktop-client-plan.md', 'utf8'),
  readFile('package.json', 'utf8'),
])
const packageData = JSON.parse(packageJson)
const checks = [
  ['桌面壳注册固定本地协议', main.includes("protocol.registerSchemesAsPrivileged") && main.includes("scheme: 'xuanji'")],
  ['桌面壳固定协议支持本地存储', main.includes('standard: true') && main.includes('secure: true') && main.includes('supportFetchAPI: true')],
  ['桌面壳关闭Node集成', main.includes('nodeIntegration: false')],
  ['桌面壳开启上下文隔离和沙箱', main.includes('contextIsolation: true') && main.includes('sandbox: true')],
  ['桌面壳禁止未审查新窗口和远程导航', main.includes('setWindowOpenHandler') && main.includes('will-navigate') && main.includes("url.startsWith('xuanji://')")],
  ['桌面预加载不暴露高权限接口', !preload.includes('contextBridge') && !preload.includes('require(')],
  ['桌面方案说明Electron和Tauri取舍', plan.includes('Electron') && plan.includes('Tauri') && plan.includes('Windows')],
  ['提供桌面开发命令', packageData.main === 'desktop/main.cjs' && packageData.scripts?.['desktop:dev'] === 'electron .'],
]
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`)
const failed = checks.filter(([, pass]) => !pass)
if (failed.length) process.exit(1)
console.log(`\nDesktop check passed: ${checks.length} checks`)

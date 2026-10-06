import { access, readFile } from 'node:fs/promises'

const required = [
  'index.html', 'src/main.js', 'src/styles.css', 'src/core/profile.js',
  'src/data/stars.js', 'src/data/solar-terms.js', 'sw.js', 'manifest.webmanifest', 'README.md',
  'docs/release.md', 'docs/content-sources.md', 'docs/external-qa-runbook.md', 'docs/external-gate-status-2026-10-04.md', 'CHANGELOG.md',
  'scripts/sw-test.mjs', 'scripts/edge-offline-check.mjs', 'scripts/desktop-check.mjs',
  'desktop/main.cjs', 'desktop/preload.cjs', 'desktop/README.md', 'docs/desktop-client-plan.md',
  'docs/value-loop-local-journal.md', 'docs/desktop-qa-2026-10-05.md',
]

for (const file of required) await access(file)

const [index, main, styles, manifest, sw, packageJson] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('src/main.js', 'utf8'),
  readFile('src/styles.css', 'utf8'),
  readFile('manifest.webmanifest', 'utf8'),
  readFile('sw.js', 'utf8'),
  readFile('package.json', 'utf8'),
])

const version = JSON.parse(packageJson).version
const packageData = JSON.parse(packageJson)

const checks = [
  ['入口使用本地模块脚本', index.includes('/src/main.js') && index.includes('type="module"')],
  ['包含离线缓存入口', index.includes('manifest.webmanifest') && main.includes('serviceWorker.register')],
  ['没有远程字体依赖', !styles.includes('fonts.googleapis.com')],
  ['没有外部脚本依赖', !index.includes('http://') && !index.includes('https://')],
  ['页面包含免责声明', main.includes('传统术数为文化演绎')],
  ['页面包含本地隐私说明', main.includes('不上传资料') && main.includes('localStorage')],
  ['页面包含反馈下载路径', main.includes('xuanji-feedback.json')],
  ['子路径部署使用相对缓存路径', manifest.includes('"start_url": "./"') && sw.includes("'./index.html'")],
  ['离线失败只回退导航页', sw.includes("event.request.mode === 'navigate'") && sw.includes('fallback || Response.error()')],
  ['版本号与离线缓存一致', version && sw.includes(`xuanji-static-v${version}`)],
  ['测试脚本包含离线行为检查', packageData.scripts?.test?.includes('scripts/sw-test.mjs')],
  ['提供一键验证命令', packageData.scripts?.verify?.includes('npm run build') && packageData.scripts?.verify?.includes('npm run http-check')],
  ['提供Edge离线验收命令', packageData.scripts?.['edge-offline-check']?.includes('scripts/edge-offline-check.mjs')],
  ['提供桌面壳静态检查', packageData.scripts?.['desktop-check']?.includes('scripts/desktop-check.mjs') && packageData.scripts?.verify?.includes('npm run desktop-check')],
  ['桌面开发入口指向本地主进程', packageData.main === 'desktop/main.cjs' && packageData.scripts?.['desktop:dev'] === 'electron .'],
]

for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`)
const failed = checks.filter(([, pass]) => !pass)
if (failed.length) process.exit(1)
console.log(`\nRelease check passed: ${checks.length} checks`)

import { readFile } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { calculateProfile } from '../src/core/profile.js'

const requiredFiles = [
  'index.html',
  'README.md',
  'src/main.js',
  'src/core/profile.js',
  'src/core/journal.js',
  'src/data/stars.js',
  'src/data/solar-terms.js',
  'src/styles.css',
  'sw.js',
  'manifest.webmanifest',
  'assets/icon.svg',
  'scripts/build-check.mjs',
  'scripts/plan-check.mjs',
  'scripts/server.mjs',
  'scripts/sw-test.mjs',
  'docs/testing.md',
  'docs/初步开发设计整体方案.md',
  'docs/user-test.md',
  'docs/browser-qa-2026-10-04.md',
  'docs/completion-audit-2026-10-04.md',
  'docs/external-qa-runbook.md',
  'docs/decisions.md',
  'docs/content-sources.md',
  'docs/algorithm-spec.md',
  'docs/roadmap-status.md',
  'docs/value-loop-local-journal.md',
  'docs/desktop-qa-2026-10-05.md',
]

for (const file of requiredFiles) await access(file)

const index = await readFile('index.html', 'utf8')
const main = await readFile('src/main.js', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')
const profile = await readFile('src/core/profile.js', 'utf8')
const journalCore = await readFile('src/core/journal.js', 'utf8')
const stars = await readFile('src/data/stars.js', 'utf8')
const solarTerms = await readFile('src/data/solar-terms.js', 'utf8')
const sw = await readFile('sw.js', 'utf8')
const manifest = await readFile('manifest.webmanifest', 'utf8')
const packageJson = JSON.parse(await readFile('package.json', 'utf8'))

const checks = [
  ['HTML入口使用模块脚本', index.includes('type="module"')],
  ['入口包含根节点', index.includes('id="root"')],
  ['脚本不可用时有启动提示', index.includes('<noscript>') && index.includes('请启用 JavaScript')],
  ['主流程包含开始按钮', main.includes('开始观盘')],
  ['主流程包含本地保存', main.includes('localStorage.setItem')],
  ['主流程包含分享卡', main.includes('分享卡')],
  ['主流程包含说明页', main.includes('function info()') && main.includes('说明与隐私')],
  ['主流程包含SVG下载', main.includes('downloadShareSvg') && main.includes('image/svg+xml')],
  ['分享卡包含星官和节气', main.includes('星官 /') && main.includes('节气 /')],
  ['输入包含日期边界', main.includes('1900-01-01') && main.includes('localDateString')],
  ['输入页包含可复现样例', main.includes('使用样例') && main.includes('2000-01-01')],
  ['输入页可以返回首页', main.includes('input-back') && main.includes('← 返回首页')],
  ['品牌按钮只返回首页不清除记录', main.includes('class="brand" data-screen="home"') && main.includes('aria-label="返回首页"')],
  ['异常日期提交有页面提示', main.includes('日期格式无效，请重新选择出生日期')],
  ['说明页包含本地反馈', main.includes('feedback-form') && main.includes('downloadFeedback')],
  ['清除本地记录同时删除反馈并提示', main.includes("localStorage.removeItem('xuanji-profile'); localStorage.removeItem('xuanji-feedback')") && main.includes('已清除本地观盘和反馈记录')],
  ['盘面入口支持键盘', main.includes('tabindex="0"') && main.includes("event.key === 'Enter'")],
  ['旧本地记录可迁移并保留四维', main.includes('calculateProfile(parsed.name') && main.includes('normalizeTraits(parsed.traits)') && main.includes('localStorage.setItem(\'xuanji-profile\'' )],
  ['入口资源使用相对路径', index.includes('./manifest.webmanifest') && index.includes('./src/styles.css') && index.includes('./src/main.js')],
  ['入口包含本地图标', index.includes('./assets/icon.svg')],
  ['一键启动使用内置服务器', packageJson.scripts?.start === 'node scripts/server.mjs' && packageJson.scripts?.dev === 'node scripts/server.mjs'],
  ['一键验证组合检查', packageJson.scripts?.verify?.includes('npm run build') && packageJson.scripts?.verify?.includes('npm run http-check')],
  ['下载链接延迟释放', main.includes('setTimeout(() => { URL.revokeObjectURL(link.href); link.remove() }, 1000)')],
  ['分享模态支持键盘与焦点', main.includes('previousFocus') && main.includes("event.key === 'Escape'") && main.includes('modal.onkeydown') && main.includes('aria-live="polite"')],
  ['表单输入有可读标签', main.includes('<label>你的称呼') && main.includes('<label>出生日期') && main.includes('aria-label="${trait.left}到${trait.right}"')],
  ['分享弹窗声明对话框语义', main.includes('role="dialog" aria-modal="true" aria-labelledby="share-title"')],
  ['支持减少动效设置', styles.includes('@media (prefers-reduced-motion: reduce)') && styles.includes('scroll-behavior: auto')],
  ['计算模块导出基础计算', profile.includes('export function calculateProfile')],
  ['计算模块导出命纹生成', profile.includes('export function createPattern')],
]

const known = calculateProfile('测试', '2000-01-01')
checks.push(['历法样本2000-01-01可重复', known.pillars.map((pillar) => pillar.value).join(' ') === '己卯 丙子 戊午'])
checks.push(['二十八宿数据可生成', stars.includes('lunarMansions') && Boolean(known.star?.name)])
checks.push(['阴阳四维可交互', main.includes('data-trait') && main.includes('traitSummary') && main.includes('localStorage.setItem')])
checks.push(['今日观象记录闭环可用', main.includes('function today()') && main.includes('today-form') && main.includes('saveObservation')])
checks.push(['观象日志支持本地时间线', main.includes('function journal()') && main.includes('xuanji-journal-v1') && main.includes('journalExport')])
checks.push(['七日复盘只做描述统计', main.includes('function review()') && main.includes('近 7 日记录') && main.includes('不是预测，也不是因果分析')])
checks.push(['五行镜头转为可执行行动', main.includes('observationLenses') && main.includes('启动') && main.includes('收束') && main.includes('沉淀')])
checks.push(['日志支持主动备份与恢复', main.includes('journalExport') && main.includes('journalImport') && main.includes('导入备份')])
checks.push(['日志条目支持删除', main.includes('data-delete-date') && main.includes('建议先导出备份')])
checks.push(['日志记录区分事实感受和下一步', main.includes('journal-felt') && main.includes('journal-next-action') && main.includes('发生了什么')])
checks.push(['日志支持两条记录对照', main.includes('function compare()') && main.includes('compare-left') && main.includes('字段差异')])
checks.push(['删除支持短时撤销', main.includes('undoJournal') && main.includes('undo-delete') && main.includes('撤销')])
checks.push(['导入先预览并确认', main.includes('导入预览') && main.includes('window.confirm') && main.includes('原有记录未改变')])
checks.push(['日志核心模块可标准化和合并', journalCore.includes('normalizeJournalEntries') && journalCore.includes('mergeJournalEntries') && journalCore.includes('removeJournalEntry')])
checks.push(['生日节气数据可生成', solarTerms.includes('solarTerms') && Boolean(known.solarTerm?.name)])
checks.push(['离线缓存路径相对且仅导航回退', sw.includes("'./index.html'") && sw.includes("event.request.mode === 'navigate'") && sw.includes('fallback || Response.error()')])
checks.push(['清单包含本地安装图标', manifest.includes('./assets/icon.svg') && sw.includes('./assets/icon.svg')])
let invalidDateRejected = false
try { calculateProfile('测试', '2000-02-30') } catch { invalidDateRejected = true }
checks.push(['计算模块拒绝不存在的日期', invalidDateRejected])

const failed = checks.filter(([, pass]) => !pass)
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`)
if (failed.length) process.exit(1)
console.log(`\nSmoke test passed: ${checks.length} checks`)

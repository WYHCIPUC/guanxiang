import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
// 总纲层文档位于仓库根 docs/；应用在 apps/butian 下运行时向上两级回退查找
const docRoots = [root, path.join(root, '..', '..')]
const requiredFiles = [
  'index.html',
  'app.html',
  'README.md',
  'SOURCES.md',
  'src/app/App.tsx',
  'src/data/demo.ts',
]

for (const file of requiredFiles) {
  const absolute = path.join(root, file)
  if (!fs.existsSync(absolute)) throw new Error(`缺少文件：${file}`)
}
for (const doc of ['docs/butian/product-scope.md', 'docs/butian/testing-checklist.md']) {
  if (!docRoots.some((base) => fs.existsSync(path.join(base, doc)))) throw new Error(`缺少文档：${doc}`)
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const app = fs.readFileSync(path.join(root, 'app.html'), 'utf8')
const demo = fs.readFileSync(path.join(root, 'src/data/demo.ts'), 'utf8')
const sources = fs.readFileSync(path.join(root, 'SOURCES.md'), 'utf8')

const expectations = [
  [index, '参宿—猎户', '静态预览包含核心切片说明'],
  [index, '下载奏折', '静态预览包含导出入口'],
  [app, 'src/main.tsx', 'React入口存在'],
  [demo, 'export const stars', '演示星点数据存在'],
  [demo, 'export const chinaLines', '中国星官连线存在'],
  [demo, 'export const westernLines', '西方星座连线存在'],
  [sources, '来源记录', '来源文档存在'],
]

for (const [content, needle, description] of expectations) {
  if (!content.includes(needle)) throw new Error(`检查失败：${description}`)
}

const starCount = (demo.match(/id:\s*'/g) ?? []).length
if (starCount < 10) throw new Error(`演示星点数量过少：${starCount}`)

// 传播物料：分享卡 SVG 母版 + PNG 栅格化产物必须齐备且含关键内容（生成器 scripts/build-share-assets.mjs）
for (const file of ['public/share/shen-vs-orion.svg', 'public/share/shen-vs-orion.png', 'public/share/guest-star-1054.svg', 'public/share/guest-star-1054.png']) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`分享物料缺少：${file}`)
}
const shareShen = fs.readFileSync(path.join(root, 'public/share/shen-vs-orion.svg'), 'utf8')
const shareGuest = fs.readFileSync(path.join(root, 'public/share/guest-star-1054.svg'), 'utf8')
for (const [content, needle, description] of [
  [shareShen, '参宿四', '对照卡含中文星名'],
  [shareShen, 'Betelgeuse', '对照卡含西名'],
  [shareGuest, '客星帖', '客星帖标题存在'],
  [shareGuest, '入参宿', '客星帖含入宿度读数'],
]) {
  if (!content.includes(needle)) throw new Error(`分享物料检查失败：${description}`)
}

if (fs.existsSync(path.join(root, 'dist'))) {
  for (const file of ['dist/index.html', 'dist/app.html']) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`构建产物缺少：${file}`)
  }
}

console.log('冒烟检查通过')
console.log(`演示星点：${starCount} 个`)
console.log('入口：静态预览 index.html；组件化版本 app.html')
console.log('分享物料：public/share/ 四件齐备（2 SVG 母版 + 2 PNG）')

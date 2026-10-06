import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'

const root = process.cwd()
const original = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const withoutRedirect = original.replace(/<script>\s*\/\/ 双击文件时[\s\S]*?<\/script>/, '')
let downloadTriggered = false

const dom = new JSDOM(withoutRedirect, {
  url: 'http://localhost/index.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.URL.createObjectURL = () => 'blob:butian-test'
    window.URL.revokeObjectURL = () => {}
    window.HTMLAnchorElement.prototype.click = () => { downloadTriggered = true }
  },
})

const { document } = dom.window
const assert = (condition, message) => {
  if (!condition) throw new Error(`交互检查失败：${message}`)
}

await new Promise((resolve) => dom.window.setTimeout(resolve, 20))
assert(document.querySelector('.welcome'), '首次打开显示欢迎引导')
document.querySelector('.welcome .primary').click()
assert(!document.querySelector('.welcome'), '点击开始观星后关闭欢迎引导')

document.querySelector('#placeBtn').click()
assert(document.querySelector('#placeBtn').textContent.includes('上海'), '可以切换观测地点')
const timeRange = document.querySelector('#timeRange')
timeRange.value = '4'
timeRange.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
assert(document.querySelector('#timeLabel').textContent === '21:30', '可以调整教学时间')

document.querySelector('[data-mode="western"]').click()
assert(document.querySelector('#modeTitle').textContent === '西方星座', '切换到西方星座模式')

document.querySelector('.star').click()
assert(document.querySelector('.floating h3'), '点击星点打开星官卡')
document.querySelector('.floating .cta').click()
assert(document.querySelector('.modal'), '从星官卡进入测量面板')

const commitButton = [...document.querySelectorAll('.modal button')].find((button) => button.textContent.includes('记入奏折'))
assert(commitButton, '测量面板存在记入奏折按钮')
commitButton.click()
assert(document.querySelector('.floating h3'), '记入奏折后显示最近一次观测')

const downloadButton = [...document.querySelectorAll('.floating button')].find((button) => button.textContent.includes('下载奏折'))
assert(downloadButton, '观测记录存在下载按钮')
downloadButton.click()
assert(downloadTriggered, '下载奏折触发浏览器下载')

console.log('交互检查通过')
console.log('覆盖：引导、地点、时间、模式切换、星官卡、测量、记录和下载')
dom.window.close()

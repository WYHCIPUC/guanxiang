import { readFile } from 'node:fs/promises'

const plan = await readFile('docs/初步开发设计整体方案.md', 'utf8')
const required = [
  '第一部分：项目理解与一句话定位', '第二部分：需求拆解', '第三部分：核心用户流程',
  '第四部分：MVP设计', '第五部分：页面与交互设计', '第六部分：视觉设计系统',
  '第七部分：技术路线', '第八部分：项目目录结构', '第九部分：数据、内容与版权',
  '第十部分：开发阶段与里程碑', '第十一部分：验收标准', '第十二部分：风险、成本与取舍',
  '第十三部分：第一周具体行动清单', '第十四部分：给 AI 开发工具的执行要求',
  '推荐的 MVP 范围', '推荐的技术路线', '第一阶段原型页面清单',
  '当前最重要的三个决策', '当前最危险的三个假设', '需要我确认的问题（最多 5 个）', '现在不要做什么',
]
const checks = required.map((item) => [item, plan.includes(item)])
checks.push(['至少十个页面/弹窗规格', (plan.match(/页面目标/g) || []).length >= 10])
checks.push(['第一周七天行动', [...Array(7)].every((_, index) => plan.includes(`第 ${index + 1} 天`))])
checks.push(['风险表包含补救列', plan.includes('出现后的补救')])
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`)
const failed = checks.filter(([, pass]) => !pass)
if (failed.length) process.exit(1)
console.log(`\nPlan check passed: ${checks.length} checks`)

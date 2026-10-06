// 根级总闸门：依次执行三应用完整验收链（INT-008 黄金标准模式）。
// 任一应用失败立即停止并给出可读摘要。
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const chains = [
  {
    name: '步天（天）',
    cwd: path.join(repoRoot, 'apps', 'butian'),
    steps: [
      ['build', 'npm run build'],
      ['test:smoke', 'npm run test:smoke'],
      ['test:astro', 'npm run test:astro'],
      ['test:render', 'npm run test:render'],
      ['test:interaction', 'npm run test:interaction'],
    ],
  },
  {
    name: '今时（时）',
    cwd: path.join(repoRoot, 'apps', 'jinshi'),
    steps: [['check-release', 'npm run check-release']],
  },
  {
    name: '璇玑（人）',
    cwd: path.join(repoRoot, 'apps', 'xuanji'),
    steps: [['verify', 'npm run verify']],
  },
]

const summary = []
for (const chain of chains) {
  process.stdout.write(`\n===== ${chain.name} =====\n`)
  for (const [label, command] of chain.steps) {
    process.stdout.write(`> ${label}: ${command}\n`)
    const result = spawnSync(command, { cwd: chain.cwd, shell: true, stdio: 'inherit' })
    if (result.status !== 0) {
      summary.push(`✗ ${chain.name} · ${label}`)
      console.error(`\nverify:all 失败：${chain.name} 的 ${label} 步骤退出码 ${result.status}`)
      process.exit(result.status ?? 1)
    }
    summary.push(`✓ ${chain.name} · ${label}`)
  }
}

console.log('\n===== verify:all 汇总 =====')
for (const line of summary) console.log(line)
console.log('\n三应用验收链全部通过。')

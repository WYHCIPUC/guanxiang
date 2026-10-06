import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'dist/index.html',
  'dist/manifest.webmanifest',
  'dist/icon.svg',
  'dist/sw.js',
  'src/content/sources.json',
  'docs/content-review.md',
  'docs/owner-runbook.md',
  'docs/first-week-user-test.md',
  'docs/acceptance-checklist.md',
];

const missing = required.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  console.error(`缺少发布文件：${missing.join(', ')}`);
  process.exit(1);
}

const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
if (!html.includes('./assets/')) {
  console.error('dist/index.html 没有使用相对资源路径。');
  process.exit(1);
}

console.log(`发布检查通过：${required.length} 个文件存在，资源路径为相对路径。`);

import { access } from 'node:fs/promises'

const publishFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'assets/icon.svg',
  'src/main.js',
  'src/styles.css',
  'src/core/profile.js',
  'src/data/stars.js',
  'src/data/solar-terms.js',
  'scripts/server.mjs',
  'scripts/sw-test.mjs',
]

for (const file of publishFiles) await access(file)
console.log(`Static build check passed: ${publishFiles.length} publish files are present.`)
console.log('This project has no bundling step; publish the project directory after npm run test and npm run release-check pass.')

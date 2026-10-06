import assert from 'node:assert/strict'
import { mergeJournalEntries, normalizeJournalEntries, normalizeJournalEntry, removeJournalEntry } from '../src/core/journal.js'

const first = normalizeJournalEntry({ date: '2026-10-05', intention: '整理资料', note: '完成了分组', felt: '比较清楚', context: '工作', lens: 'metal' })
assert.equal(first.context, '工作')
assert.equal(first.note, '完成了分组')
assert.equal(first.felt, '比较清楚')
assert.equal(first.lens, 'metal')
assert.equal(normalizeJournalEntry({ date: '2026-10-05' }), null)

const oldStyle = normalizeJournalEntries([{ observedOn: '2026-10-04', title: '旧格式记录', whatHappened: '旧数据仍可恢复' }])
assert.equal(oldStyle.length, 1)
assert.equal(oldStyle[0].intention, '旧格式记录')

const merged = mergeJournalEntries([first], [
  { date: '2026-10-05', intention: '更新后的资料', note: '覆盖同一天' },
  { date: '2026-10-03', intention: '新增记录', note: '新增内容' },
  { date: '不是日期', note: '应跳过' },
])
assert.equal(merged.added, 1)
assert.equal(merged.overwritten, 1)
assert.equal(merged.skipped, 1)
assert.equal(merged.entries.length, 2)
assert.equal(merged.entries.find((entry) => entry.date === '2026-10-05').intention, '更新后的资料')

const removed = removeJournalEntry(merged.entries, '2026-10-03')
assert.equal(removed.length, 1)
assert.equal(removed[0].date, '2026-10-05')

console.log('Journal core test passed: normalize, migrate, merge, skip invalid, remove')

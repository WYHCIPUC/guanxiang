export const journalContexts = ['工作', '学习', '创作', '关系', '选择', '节奏', '情绪', '其他']

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function fallbackId(dateValue) {
  return `rec_${dateValue || 'draft'}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function createId(dateValue) {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch {
    // Older WebViews can expose crypto without randomUUID; use the local fallback.
  }
  return fallbackId(dateValue)
}

function clampScale(value, fallback = 3) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(5, Math.max(1, Math.round(numeric))) : fallback
}

function cleanText(value, max = 800) {
  return String(value ?? '').trim().slice(0, max)
}

export function isJournalDate(value) {
  return typeof value === 'string' && datePattern.test(value)
}

export function normalizeJournalEntry(item = {}, fallbackDate = '') {
  const date = isJournalDate(item.date) ? item.date : (isJournalDate(item.observedOn) ? item.observedOn : fallbackDate)
  if (!isJournalDate(date)) return null
  const intention = cleanText(item.intention || item.title || item.nextAction, 120)
  const note = cleanText(item.note || item.whatHappened, 800)
  if (!intention && !note) return null
  const context = journalContexts.includes(item.context) ? item.context : '其他'
  return {
    schemaVersion: 1,
    id: cleanText(item.id, 80) || createId(date),
    date,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    lens: cleanText(item.lens, 30) || 'earth',
    context,
    mood: cleanText(item.mood, 30) || '平静',
    energy: clampScale(item.energy),
    focus: clampScale(item.focus),
    intention,
    note,
    felt: cleanText(item.felt, 300),
    nextAction: cleanText(item.nextAction, 300),
    done: Boolean(item.done),
    profileSnapshot: item.profileSnapshot || undefined,
    source: 'manual',
  }
}

export function normalizeJournalEntries(input, max = 365) {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => normalizeJournalEntry(item))
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, max)
}

function entryKey(entry) {
  return entry.id ? `id:${entry.id}` : `date:${entry.date}`
}

export function mergeJournalEntries(current, incoming, max = 365) {
  const existing = normalizeJournalEntries(current, max)
  const accepted = normalizeJournalEntries(incoming, max)
  const result = [...existing]
  let added = 0
  let overwritten = 0
  let skipped = Math.max(0, Array.isArray(incoming) ? incoming.length - accepted.length : 0)
  accepted.forEach((entry) => {
    const byId = result.findIndex((item) => entryKey(item) === entryKey(entry))
    const byDate = result.findIndex((item) => item.date === entry.date)
    const index = byId >= 0 ? byId : byDate
    if (index >= 0) {
      result[index] = { ...result[index], ...entry, id: result[index].id || entry.id, updatedAt: new Date().toISOString() }
      overwritten += 1
    } else {
      result.push(entry)
      added += 1
    }
  })
  return { entries: result.sort((a, b) => b.date.localeCompare(a.date)).slice(0, max), added, overwritten, skipped }
}

export function removeJournalEntry(entries, predicate) {
  return normalizeJournalEntries(entries).filter((entry) => typeof predicate === 'function' ? !predicate(entry) : entry.date !== predicate && entry.id !== predicate)
}

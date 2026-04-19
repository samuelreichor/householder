#!/usr/bin/env node
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const DB_PATH = resolve(process.cwd(), 'data/householder.sqlite')
mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    task_key TEXT NOT NULL,
    done_at INTEGER NOT NULL
  );
`)

const cols = db.prepare('PRAGMA table_info(task_logs)').all()
if (!cols.some(c => c.name === 'custom_label')) {
  db.exec('ALTER TABLE task_logs ADD COLUMN custom_label TEXT')
}

const FAKE_USERS = [
  { id: 'demo-alex', email: 'alex@demo.local', name: 'Alex Fischer', picture: null },
  { id: 'demo-jamie', email: 'jamie@demo.local', name: 'Jamie Weber', picture: null }
]

const RESET = process.argv.includes('--reset')

if (RESET) {
  const del = db.prepare('DELETE FROM task_logs WHERE user_id = ?')
  const delUser = db.prepare('DELETE FROM users WHERE id = ?')
  const tx = db.transaction(() => {
    for (const u of FAKE_USERS) {
      const r = del.run(u.id)
      delUser.run(u.id)
      console.log(`  ✓ removed ${u.name} (${r.changes} logs)`)
    }
  })
  tx()
  console.log('Demo data cleared.')
  process.exit(0)
}

const TASK_KEYS = ['dishwasher_out', 'trash', 'vacuum', 'mopping', 'laundry_wash', 'laundry_fold', 'bathroom']
const CUSTOM_LABELS = [
  'Pflanzen gegossen',
  'Fenster geputzt',
  'Kühlschrank ausgemistet',
  'Katze gefüttert',
  'Briefkasten geleert',
  'Spülmaschinentab nachgefüllt'
]

const insertUser = db.prepare(`
  INSERT INTO users (id, email, name, picture, created_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET name = excluded.name
`)

for (const u of FAKE_USERS) {
  insertUser.run(u.id, u.email, u.name, u.picture, Date.now())
}

const realUsers = db.prepare(`SELECT id FROM users WHERE id NOT LIKE 'demo-%'`).all()
const allUserIds = [...realUsers.map(r => r.id), ...FAKE_USERS.map(u => u.id)]

if (allUserIds.length === 0) {
  console.error('No users found. Log in at least once before seeding, or seed only runs demo users.')
  process.exit(1)
}

const insertLog = db.prepare(`
  INSERT INTO task_logs (user_id, task_key, done_at, custom_label)
  VALUES (?, ?, ?, ?)
`)

const rand = (a, b) => a + Math.random() * (b - a)
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

const now = Date.now()
const today = new Date()

let total = 0
const tx = db.transaction(() => {
  for (let m = 5; m >= 0; m--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - m, 1).getTime()
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - m + 1, 1).getTime()
    const capEnd = Math.min(monthEnd, now)

    for (const uid of allUserIds) {
      const baseline = uid.startsWith('demo-alex') ? 1.1 : uid.startsWith('demo-jamie') ? 0.9 : 1.0
      const monthlyBoost = 0.6 + Math.random() * 0.8
      const target = Math.round(rand(18, 32) * baseline * monthlyBoost)
      const actual = m === 0 ? Math.round(target * 0.3) : target

      for (let i = 0; i < actual; i++) {
        const doneAt = Math.floor(rand(monthStart, capEnd))
        const isCustom = Math.random() < 0.12
        if (isCustom) {
          insertLog.run(uid, 'custom', doneAt, pick(CUSTOM_LABELS))
        } else {
          insertLog.run(uid, pick(TASK_KEYS), doneAt, null)
        }
        total++
      }
    }
  }
})
tx()

const perUser = db.prepare(`
  SELECT u.name, COUNT(l.id) as count
  FROM users u
  LEFT JOIN task_logs l ON l.user_id = u.id
  GROUP BY u.id
  ORDER BY count DESC
`).all()

console.log(`Seeded ${total} task logs across 6 months.`)
console.log('\nTotal logs per user:')
for (const row of perUser) {
  console.log(`  ${row.name.padEnd(20)} ${row.count}`)
}
console.log('\nTo undo: npm run seed:reset')

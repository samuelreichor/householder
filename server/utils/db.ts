import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'

let db: Database.Database | null = null

export function useDb() {
  if (db) return db

  const path = process.env.DB_PATH
    ? resolve(process.env.DB_PATH)
    : resolve(process.cwd(), 'data/householder.sqlite')
  mkdirSync(dirname(path), { recursive: true })

  db = new Database(path)
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

    CREATE INDEX IF NOT EXISTS idx_task_logs_done_at ON task_logs(done_at DESC);
    CREATE INDEX IF NOT EXISTS idx_task_logs_user ON task_logs(user_id);
  `)

  const cols = db.prepare('PRAGMA table_info(task_logs)').all() as { name: string }[]
  if (!cols.some(c => c.name === 'custom_label')) {
    db.exec('ALTER TABLE task_logs ADD COLUMN custom_label TEXT')
  }

  return db
}

interface Row {
  ym: string
  user_id: string
  name: string
  picture: string | null
  count: number
}

interface Entry {
  user: { id: string, name: string, picture?: string }
  count: number
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const db = useDb()
  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m', l.done_at/1000, 'unixepoch') AS ym,
      u.id AS user_id, u.name, u.picture,
      COUNT(*) AS count
    FROM task_logs l
    JOIN users u ON u.id = l.user_id
    WHERE l.done_at < ?
    GROUP BY ym, u.id
    ORDER BY ym DESC, count DESC, u.name ASC
  `).all(currentMonthStart) as Row[]

  const monthsMap = new Map<string, { ym: string, year: number, month: number, total: number, entries: Entry[] }>()
  for (const r of rows) {
    const parts = r.ym.split('-').map(Number)
    const year = parts[0] ?? 0
    const month = parts[1] ?? 0
    if (!monthsMap.has(r.ym)) {
      monthsMap.set(r.ym, { ym: r.ym, year, month, total: 0, entries: [] })
    }
    const bucket = monthsMap.get(r.ym)!
    bucket.entries.push({
      user: { id: r.user_id, name: r.name, picture: r.picture ?? undefined },
      count: r.count
    })
    bucket.total += r.count
  }

  return { months: Array.from(monthsMap.values()) }
})

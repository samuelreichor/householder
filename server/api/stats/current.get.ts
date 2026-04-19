interface Row {
  id: string
  name: string
  picture: string | null
  count: number
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()

  const db = useDb()
  const rows = db.prepare(`
    SELECT u.id, u.name, u.picture, COUNT(*) AS count
    FROM task_logs l
    JOIN users u ON u.id = l.user_id
    WHERE l.done_at >= ? AND l.done_at < ?
    GROUP BY u.id
    ORDER BY count DESC, u.name ASC
  `).all(start, end) as Row[]

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    entries: rows.map(r => ({
      user: {
        id: r.id,
        name: r.name,
        picture: r.picture ?? undefined
      },
      count: r.count
    }))
  }
})

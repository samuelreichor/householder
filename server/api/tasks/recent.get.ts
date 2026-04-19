import { TASK_MAP } from '~~/server/utils/tasks'

interface LogRow {
  id: number
  task_key: string
  custom_label: string | null
  done_at: number
  user_id: string
  user_name: string
  user_picture: string | null
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 100, 500)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const db = useDb()
  const rows = db.prepare(`
    SELECT l.id, l.task_key, l.custom_label, l.done_at, l.user_id,
           u.name AS user_name, u.picture AS user_picture
    FROM task_logs l
    JOIN users u ON u.id = l.user_id
    WHERE l.done_at >= ?
    ORDER BY l.done_at DESC
    LIMIT ?
  `).all(monthStart, limit) as LogRow[]

  return {
    logs: rows.map((r) => {
      const task = TASK_MAP[r.task_key]
      const label = r.custom_label ?? task?.label ?? r.task_key
      return {
        id: r.id,
        taskKey: r.task_key,
        taskLabel: label,
        taskIcon: task?.icon ?? 'i-lucide-check',
        doneAt: r.done_at,
        user: {
          id: r.user_id,
          name: r.user_name,
          picture: r.user_picture ?? undefined
        }
      }
    })
  }
})

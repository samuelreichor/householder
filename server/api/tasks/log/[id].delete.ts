export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDb()
  const row = db.prepare('SELECT user_id FROM task_logs WHERE id = ?').get(id) as { user_id: string } | undefined

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  if (row.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  db.prepare('DELETE FROM task_logs WHERE id = ?').run(id)

  return { ok: true, id }
})

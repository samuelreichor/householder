import { CUSTOM_TASK_KEY, TASK_MAP } from '~~/server/utils/tasks'

const MAX_CUSTOM_LEN = 80

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody<{ taskKey?: string, customLabel?: string }>(event)
  const taskKey = body?.taskKey

  if (!taskKey || !(taskKey in TASK_MAP)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown task' })
  }

  let customLabel: string | null = null
  if (taskKey === CUSTOM_TASK_KEY) {
    const raw = (body?.customLabel || '').trim()
    if (!raw) {
      throw createError({ statusCode: 400, statusMessage: 'Eigener Task braucht eine Beschreibung' })
    }
    if (raw.length > MAX_CUSTOM_LEN) {
      throw createError({ statusCode: 400, statusMessage: `Max. ${MAX_CUSTOM_LEN} Zeichen` })
    }
    customLabel = raw
  }

  const db = useDb()
  const now = Date.now()

  const result = db.prepare(`
    INSERT INTO task_logs (user_id, task_key, done_at, custom_label)
    VALUES (?, ?, ?, ?)
  `).run(user.id, taskKey, now, customLabel)

  return {
    ok: true,
    id: result.lastInsertRowid,
    taskKey,
    customLabel,
    doneAt: now
  }
})

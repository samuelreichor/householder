import { TASKS } from '~~/server/utils/tasks'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  return { tasks: TASKS }
})

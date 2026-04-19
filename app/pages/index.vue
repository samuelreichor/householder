<script setup lang="ts">
import type { Task } from '~~/server/utils/tasks'

interface UserRef {
  id: string
  name: string
  picture?: string
}

interface LogEntry {
  id: number
  taskKey: string
  taskLabel: string
  taskIcon: string
  doneAt: number
  user: UserRef
}

interface StatsEntry { user: UserRef, count: number }
interface CurrentMonth { year: number, month: number, entries: StatsEntry[] }
interface MonthHistory { ym: string, year: number, month: number, total: number, entries: StatsEntry[] }

const toast = useToast()
const { user } = useUserSession()

const { data: tasksData } = await useFetch<{ tasks: Task[] }>('/api/tasks')
const { data: logsData, refresh: refreshLogs } = await useFetch<{ logs: LogEntry[] }>('/api/tasks/recent')
const { data: currentMonth, refresh: refreshCurrent } = await useFetch<CurrentMonth>('/api/stats/current')
const { data: history, refresh: refreshHistory } = await useFetch<{ months: MonthHistory[] }>('/api/stats/history')

const submitting = ref<string | null>(null)
const deletingId = ref<number | null>(null)
const openHistory = ref<string | null>(null)

const customOpen = ref(false)
const customText = ref('')
const CUSTOM_MAX = 80

async function deleteLog(id: number) {
  if (deletingId.value) return
  deletingId.value = id
  try {
    await $fetch(`/api/tasks/log/${id}`, { method: 'DELETE' })
    await Promise.all([refreshLogs(), refreshCurrent()])
    toast.add({
      title: 'Eintrag gelöscht',
      color: 'neutral',
      icon: 'i-lucide-trash-2'
    })
  } catch {
    toast.add({
      title: 'Fehler',
      description: 'Eintrag konnte nicht gelöscht werden.',
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}

async function logTask(task: Task) {
  if (task.custom) {
    customText.value = ''
    customOpen.value = true
    return
  }
  if (submitting.value) return
  submitting.value = task.key
  try {
    await $fetch('/api/tasks/log', {
      method: 'POST',
      body: { taskKey: task.key }
    })
    toast.add({
      title: task.label,
      description: 'Erledigt!',
      icon: task.icon,
      color: 'success'
    })
    await Promise.all([refreshLogs(), refreshCurrent()])
  } catch {
    toast.add({
      title: 'Fehler',
      description: 'Konnte nicht gespeichert werden.',
      color: 'error'
    })
  } finally {
    submitting.value = null
  }
}

async function submitCustom() {
  const text = customText.value.trim()
  if (!text || submitting.value) return
  submitting.value = 'custom'
  try {
    await $fetch('/api/tasks/log', {
      method: 'POST',
      body: { taskKey: 'custom', customLabel: text }
    })
    toast.add({
      title: text,
      description: 'Erledigt!',
      icon: 'i-lucide-pencil-line',
      color: 'success'
    })
    customOpen.value = false
    customText.value = ''
    await Promise.all([refreshLogs(), refreshCurrent()])
  } catch (err: unknown) {
    const e = err as { statusMessage?: string }
    toast.add({
      title: 'Fehler',
      description: e?.statusMessage || 'Konnte nicht gespeichert werden.',
      color: 'error'
    })
  } finally {
    submitting.value = null
  }
}

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const monthLabel = (year: number, month: number) => `${MONTH_NAMES[month - 1]} ${year}`

const relativeTime = (ts: number) => {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'gestern'
  return `vor ${days} Tagen`
}

const todayKey = new Date().toDateString()
const countToday = (taskKey: string) =>
  (logsData.value?.logs || []).filter(
    l => l.taskKey === taskKey && new Date(l.doneAt).toDateString() === todayKey
  ).length

const rankEmoji = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '')

const maxCurrent = computed(() => {
  const max = currentMonth.value?.entries?.[0]?.count ?? 0
  return max > 0 ? max : 1
})

onMounted(() => {
  refreshHistory()
})
</script>

<template>
  <UContainer class="py-5 sm:py-8 max-w-2xl">
    <!-- Greeting -->
    <div class="mb-5">
      <h1 class="text-xl sm:text-2xl font-semibold">
        Hallo{{ user?.name ? `, ${user.name.split(' ')[0]}` : '' }} 👋
      </h1>
      <p class="text-muted text-sm mt-1">
        Was hast du im Haushalt gemacht?
      </p>
    </div>

    <!-- Dashboard: current month -->
    <UCard class="mb-5">
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-trophy" class="size-5 text-primary" />
            <h2 class="font-semibold text-sm sm:text-base">
              Diesen Monat
            </h2>
          </div>
          <span class="text-xs sm:text-sm text-muted">
            {{ currentMonth ? monthLabel(currentMonth.year, currentMonth.month) : '' }}
          </span>
        </div>
      </template>

      <ul v-if="currentMonth?.entries?.length" class="space-y-4">
        <li
          v-for="(entry, idx) in currentMonth.entries"
          :key="entry.user.id"
          class="flex items-center gap-3 py-1"
        >
          <div class="w-6 text-center text-lg shrink-0">
            <span v-if="rankEmoji(idx)">{{ rankEmoji(idx) }}</span>
            <span v-else class="text-muted text-sm">{{ idx + 1 }}</span>
          </div>
          <UAvatar :src="entry.user.picture" :alt="entry.user.name" size="sm" referrerpolicy="no-referrer" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-sm truncate">{{ entry.user.name }}</span>
              <UBadge
                :label="`${entry.count}`"
                color="primary"
                variant="subtle"
                class="shrink-0"
              />
            </div>
            <UProgress
              :model-value="(entry.count / maxCurrent) * 100"
              :color="idx === 0 ? 'primary' : 'neutral'"
              size="xs"
              class="mt-2"
            />
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-muted text-center py-2">
        Noch nichts erledigt diesen Monat.
      </p>
    </UCard>

    <!-- Task buttons -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
      <button
        v-for="task in tasksData?.tasks || []"
        :key="task.key"
        type="button"
        :disabled="submitting !== null && submitting !== task.key"
        class="relative min-h-24 p-3 rounded-2xl flex items-start gap-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        :class="task.classes.base"
        @click="logTask(task)"
      >
        <UIcon
          :name="task.icon"
          class="size-5 mt-0.5 shrink-0"
          :class="task.classes.icon"
        />
        <span
          class="text-sm sm:text-base leading-tight whitespace-normal font-medium"
          :class="countToday(task.key) > 0 ? 'pr-10' : ''"
        >
          {{ task.label }}
        </span>
        <span
          v-if="submitting === task.key && !task.custom"
          class="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-default/60"
        >
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        </span>
        <UBadge
          v-if="countToday(task.key) > 0"
          :label="`${countToday(task.key)}×`"
          color="neutral"
          variant="subtle"
          class="absolute top-2.5 right-2.5"
        />
      </button>
    </div>

    <!-- Custom task modal -->
    <UModal
      v-model:open="customOpen"
      title="Eigener Task"
      description="Was hast du erledigt?"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <UInput
          v-model="customText"
          placeholder="z.B. Pflanzen gegossen"
          :maxlength="CUSTOM_MAX"
          size="lg"
          autofocus
          class="w-full"
          @keyup.enter="submitCustom"
        />
        <p class="text-xs text-muted mt-2 text-right">
          {{ customText.length }} / {{ CUSTOM_MAX }}
        </p>
      </template>
      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="customOpen = false"
        >
          Abbrechen
        </UButton>
        <UButton
          color="primary"
          :loading="submitting === 'custom'"
          :disabled="!customText.trim()"
          @click="submitCustom"
        >
          Speichern
        </UButton>
      </template>
    </UModal>

    <!-- Recent activity -->
    <div class="mb-8">
      <h2 class="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-activity" class="size-5 text-muted" />
        Letzte Aktivitäten
      </h2>
      <div v-if="!logsData?.logs?.length" class="text-sm text-muted py-6 text-center">
        Noch nichts erledigt. Los geht's!
      </div>
      <ul v-else class="divide-y divide-default">
        <li
          v-for="log in logsData.logs"
          :key="log.id"
          class="flex items-center gap-3 py-3"
        >
          <UAvatar
            :src="log.user.picture"
            :alt="log.user.name"
            size="sm"
            referrerpolicy="no-referrer"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium truncate">{{ log.user.name.split(' ')[0] }}</span>
              <UIcon :name="log.taskIcon" class="size-4 text-muted shrink-0" />
              <span class="truncate text-muted">{{ log.taskLabel }}</span>
            </div>
            <div class="text-xs text-muted">
              {{ relativeTime(log.doneAt) }}
            </div>
          </div>
          <UPopover v-if="log.user.id === user?.id" mode="click">
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="neutral"
              size="sm"
              :loading="deletingId === log.id"
              aria-label="Eintrag löschen"
            />
            <template #content>
              <div class="p-2 flex items-center gap-2">
                <span class="text-sm px-1">Wirklich löschen?</span>
                <UButton
                  color="error"
                  variant="solid"
                  size="xs"
                  :loading="deletingId === log.id"
                  @click="deleteLog(log.id)"
                >
                  Ja, löschen
                </UButton>
              </div>
            </template>
          </UPopover>
        </li>
      </ul>
    </div>

    <!-- Past months history -->
    <div v-if="history?.months?.length">
      <h2 class="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-calendar-days" class="size-5 text-muted" />
        Vergangene Monate
      </h2>
      <div class="space-y-2">
        <div
          v-for="m in history.months"
          :key="m.ym"
          class="rounded-2xl ring ring-default overflow-hidden bg-default divide-y divide-default"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-elevated/50 transition-colors"
            @click="openHistory = openHistory === m.ym ? null : m.ym"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-lg shrink-0">🏆</span>
              <div class="min-w-0">
                <div class="font-medium text-sm truncate">
                  {{ monthLabel(m.year, m.month) }}
                </div>
                <div class="text-xs text-muted truncate">
                  {{ m.entries[0]?.user.name.split(' ')[0] }} · {{ m.entries[0]?.count }} Aufgaben
                </div>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 text-muted shrink-0 transition-transform"
              :class="openHistory === m.ym ? 'rotate-180' : ''"
            />
          </button>
          <div v-if="openHistory === m.ym" class="px-4 py-3 space-y-3">
            <div
              v-for="(entry, idx) in m.entries"
              :key="entry.user.id"
              class="flex items-center gap-3"
            >
              <div class="w-6 text-center text-sm shrink-0">
                <span v-if="rankEmoji(idx)" class="text-base">{{ rankEmoji(idx) }}</span>
                <span v-else class="text-muted">{{ idx + 1 }}</span>
              </div>
              <UAvatar :src="entry.user.picture" :alt="entry.user.name" size="sm" referrerpolicy="no-referrer" />
              <span class="flex-1 text-sm truncate">{{ entry.user.name }}</span>
              <UBadge
                :label="`${entry.count}`"
                color="neutral"
                variant="subtle"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

export interface TaskClasses {
  base: string
  icon: string
}

export interface Task {
  key: string
  label: string
  icon: string
  classes: TaskClasses
  custom?: boolean
}

export const CUSTOM_TASK_KEY = 'custom'

export const TASKS: Task[] = [
  {
    key: 'dishwasher_out',
    label: 'Geschirrspüler ausräumen',
    icon: 'i-lucide-package-open',
    classes: {
      base: 'bg-teal-50 hover:bg-teal-100 text-teal-900 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-100',
      icon: 'text-teal-500 dark:text-teal-400'
    }
  },
  {
    key: 'trash',
    label: 'Müll rausgebracht',
    icon: 'i-lucide-trash-2',
    classes: {
      base: 'bg-orange-50 hover:bg-orange-100 text-orange-900 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:text-orange-100',
      icon: 'text-orange-500 dark:text-orange-400'
    }
  },
  {
    key: 'vacuum',
    label: 'Gestaubsaugt',
    icon: 'i-lucide-wind',
    classes: {
      base: 'bg-purple-50 hover:bg-purple-100 text-purple-900 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-100',
      icon: 'text-purple-500 dark:text-purple-400'
    }
  },
  {
    key: 'mopping',
    label: 'Boden gewischt',
    icon: 'i-lucide-droplets',
    classes: {
      base: 'bg-blue-50 hover:bg-blue-100 text-blue-900 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-100',
      icon: 'text-blue-500 dark:text-blue-400'
    }
  },
  {
    key: 'laundry_wash',
    label: 'Wäsche gewaschen',
    icon: 'i-lucide-shirt',
    classes: {
      base: 'bg-pink-50 hover:bg-pink-100 text-pink-900 dark:bg-pink-500/10 dark:hover:bg-pink-500/20 dark:text-pink-100',
      icon: 'text-pink-500 dark:text-pink-400'
    }
  },
  {
    key: 'laundry_fold',
    label: 'Wäsche zusammengelegt',
    icon: 'i-lucide-layers',
    classes: {
      base: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 dark:text-yellow-100',
      icon: 'text-yellow-500 dark:text-yellow-400'
    }
  },
  {
    key: 'bathroom',
    label: 'Bad geputzt',
    icon: 'i-lucide-bath',
    classes: {
      base: 'bg-green-50 hover:bg-green-100 text-green-900 dark:bg-green-500/10 dark:hover:bg-green-500/20 dark:text-green-100',
      icon: 'text-green-500 dark:text-green-400'
    }
  },
  {
    key: CUSTOM_TASK_KEY,
    label: 'Eigener Task',
    icon: 'i-lucide-pencil-line',
    custom: true,
    classes: {
      base: 'bg-transparent hover:bg-elevated text-default border-2 border-dashed border-default',
      icon: 'text-muted'
    }
  }
]

export const TASK_MAP: Record<string, Task> = Object.fromEntries(
  TASKS.map(t => [t.key, t])
)

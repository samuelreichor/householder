<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const error = computed(() => {
  const e = route.query.error
  if (e === 'forbidden') return 'Diese Email-Adresse ist nicht für den Haushalt freigegeben.'
  if (e === 'oauth') return 'Anmeldung fehlgeschlagen. Bitte nochmal versuchen.'
  return null
})
</script>

<template>
  <div class="min-h-svh flex items-center justify-center p-6 bg-default">
    <UCard class="w-full max-w-sm">
      <div class="flex flex-col items-center gap-6 py-6">
        <div class="flex flex-col items-center gap-2 text-center">
          <UIcon name="i-lucide-house" class="size-10 text-primary" />
          <h1 class="text-2xl font-semibold">
            Householder
          </h1>
          <p class="text-sm text-muted">
            Melde dich an, um deinen Haushalt zu tracken.
          </p>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
          icon="i-lucide-circle-alert"
          class="w-full"
        />

        <UButton
          to="/auth/google"
          external
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-simple-icons-google"
          block
        >
          Mit Google anmelden
        </UButton>
      </div>
    </UCard>
  </div>
</template>

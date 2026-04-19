<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'de' }
})

useSeoMeta({
  title: 'Householder',
  description: 'Haushaltsaufgaben gemeinsam tracken.'
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <UHeader v-if="loggedIn" :toggle="false">
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
          <UIcon name="i-lucide-house" class="size-5 text-primary" />
          Householder
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />

        <UDropdownMenu
          v-if="user"
          :items="[[{
            label: user.name,
            type: 'label'
          }], [{
            label: 'Abmelden',
            icon: 'i-lucide-log-out',
            onSelect: logout
          }]]"
        >
          <UAvatar
            :src="user.picture"
            :alt="user.name"
            size="sm"
            referrerpolicy="no-referrer"
          />
        </UDropdownMenu>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>

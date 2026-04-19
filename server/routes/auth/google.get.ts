export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile']
  },

  async onSuccess(event, { user: googleUser }) {
    const config = useRuntimeConfig()
    const allowed = (config.allowedEmails || '')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean)

    const email = String(googleUser.email).toLowerCase()

    if (allowed.length > 0 && !allowed.includes(email)) {
      return sendRedirect(event, '/login?error=forbidden')
    }

    const db = useDb()
    const now = Date.now()

    db.prepare(`
      INSERT INTO users (id, email, name, picture, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        picture = excluded.picture
    `).run(
      String(googleUser.sub),
      email,
      String(googleUser.name || email),
      googleUser.picture ? String(googleUser.picture) : null,
      now
    )

    await setUserSession(event, {
      user: {
        id: String(googleUser.sub),
        email,
        name: String(googleUser.name || email),
        picture: googleUser.picture ? String(googleUser.picture) : undefined
      }
    })

    return sendRedirect(event, '/')
  },

  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  }
})

declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    picture?: string
  }

  interface UserSession {
    user: User
  }
}

export {}

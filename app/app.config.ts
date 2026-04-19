export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      secondary: 'gray',
      neutral: 'slate'
    },
    card: {
      slots: {
        root: 'rounded-2xl overflow-hidden bg-default ring ring-default divide-y divide-default'
      }
    }
  }
})

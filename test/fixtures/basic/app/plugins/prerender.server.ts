export default defineNuxtPlugin((nuxtApp) => {
  // Pretend to be prerendered, except for the server-rendered scroll tests
  if (useRoute().path !== '/scroll') {
    nuxtApp.payload.prerenderedAt = Date.now()
  }
})

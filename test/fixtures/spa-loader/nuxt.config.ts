export default defineNuxtConfig({
  devtools: { enabled: false },
  spaLoadingTemplate: true,
  routeRules: {
    '/spa': { ssr: false },
    '/ssr': { ssr: true },
  },
  experimental: {
    spaPreloaderOutside: false,
  },
  compatibilityDate: '2024-06-28',
})

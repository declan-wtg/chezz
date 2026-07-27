// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  nitro: {
    devProxy: {
      // Reverse-proxy /api to the .NET backend in dev so the browser stays
      // same-origin (no CORS). Nitro's devProxy does NOT strip the /api prefix,
      // and the backend already serves everything under /api, so it lines up.
      '/api': { target: 'http://localhost:5281/api' },
    },
  },
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  css: ["./app/assets/css/main.css"]
})

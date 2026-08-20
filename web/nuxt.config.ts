import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  ssr: false,
  css: ["./app/assets/main.css"],
  runtimeConfig: {
    public: {
      // NUXT_PUBLIC_WS_ENDPOINT
      wsEndpoint: "http://localhost:5281/",
    },
  },
  nitro: {
    devProxy: {
      "/api": {
        target: "http://localhost:5281/api",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  vite: { plugins: [tailwindcss()] },
});

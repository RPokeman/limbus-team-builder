// apps/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      // Enable SW in `pnpm -C apps/web dev`
      devOptions: {
        enabled: true,
      },

      // You can add real icons later; leaving empty avoids adding repo bloat now.
      manifest: {
        name: "Limbus Team Builder",
        short_name: "LimbusTB",
        start_url: ".",
        display: "standalone",
        background_color: "#0b0b0d",
        theme_color: "#0b0b0d",
        icons: [],
      },

      workbox: {
        runtimeCaching: [
          {
            // Cache wiki.gg thumbnails/originals (now that you use /images/thumb/...)
            urlPattern: ({ url }) =>
              url.hostname === "limbuscompany.wiki.gg" &&
              (url.pathname.startsWith("/images/") ||
                url.pathname.includes("/wiki/Special:FilePath/") ||
                url.pathname.endsWith(".png") ||
                url.pathname.endsWith(".jpg") ||
                url.pathname.endsWith(".jpeg") ||
                url.pathname.endsWith(".webp")),
            handler: "CacheFirst",
            options: {
              cacheName: "wiki-images",
              expiration: {
                maxEntries: 1500,
                maxAgeSeconds: 60 * 60 * 24 * 180, // 180 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/images": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});

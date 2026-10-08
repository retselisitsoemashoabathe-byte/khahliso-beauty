import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { createApi } from "./server/api.js"

const api = createApi()

function attach(server) {
  server.middlewares.use((req, res, next) => {
    const url = req.url || ""
    if (!url.startsWith("/api")) return next()
    api(req, res, next)
  })
}

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [
    react(),
    {
      name: "khahliso-bookings",
      configureServer: attach,
      configurePreviewServer: attach,
    },
  ],
})

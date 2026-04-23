import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl"; // 🔥 Naya plugin import kiya

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // 🔥 Localhost ko HTTPS banane ke liye
  ],

  server: {
    port: 3000,
    https: true, // 🔥 Vite ko bataya ki HTTPS use kare

    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false // 🔥 Backend agar HTTP hai toh ye zaroori hai
      }
    }
  }
});

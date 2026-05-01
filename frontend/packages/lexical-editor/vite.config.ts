import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig(({ command }) => ({
	plugins: [react()],
	server: { port: 5183, strictPort: true },
	build: command === "build"
		? {
				lib: { entry: resolve(__dirname, "src/index.ts"), formats: ["es"], fileName: "index" },
				rollupOptions: { external: [] },
				sourcemap: true,
			}
		: undefined,
}))

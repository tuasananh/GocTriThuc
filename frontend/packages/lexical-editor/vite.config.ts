import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig(({ command }) => ({
	plugins: [react()],
	resolve: {
		alias: {
			shared: resolve(__dirname, "src/playground-vendor/shared"),
		},
	},
	server: { port: 5183, strictPort: true },
	build: command === "build"
		? {
				lib: { entry: resolve(__dirname, "src/index.ts"), formats: ["es"], fileName: "index" },
				rollupOptions: { 
					external: [
						"katex", 
						"@excalidraw/excalidraw", 
						"yjs", 
						"y-websocket",
						"lodash-es",
						"prettier",
						"react-error-boundary"
					] 
				},
				sourcemap: true,
			}
		: undefined,
}))

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import Pages from "vite-plugin-pages";

const baseUrl = "/tutorial-phaser";

// https://vite.dev/config/
export default defineConfig({
	base: baseUrl,
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		Pages({
			dirs: [{ dir: "src/pages", baseRoute: "" }], // 指定頁面目錄
			extensions: ["jsx", "js"],
		}),
	],
});

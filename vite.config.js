import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import Pages from "vite-plugin-pages";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		Pages({
			dirs: "src/pages", // 指定頁面目錄
			extensions: ["jsx", "js"],
		}),
	],
});

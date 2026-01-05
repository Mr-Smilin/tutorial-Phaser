import { ViteReactSSG } from "vite-react-ssg";
import routes from "~react-pages"; // 自動生成的路由
import "./index.css";

export const createRoot = ViteReactSSG(
	{ routes },
	({ router, routes, isClient, initialState }) => {
		// 客製化設定（可選）
	}
);

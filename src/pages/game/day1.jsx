import { useEffect, useRef } from "react";

function GameComponent() {
	const gameRef = useRef(null);

	useEffect(() => {
		// 確保在客戶端才執行
		if (typeof window === "undefined") return;

		const initGame = async () => {
			const PhaserModule = await import("phaser");
			const Phaser = PhaserModule.default || PhaserModule;

			const config = {
				type: Phaser.AUTO,
				width: 800,
				height: 600,
				parent: "phaser-game",
				scene: { preload, create, update },
			};

			gameRef.current = new Phaser.Game(config);
		};

		function preload() {
			// 載入資源
		}

		function create() {
			// 建立遊戲物件
		}

		function update() {
			// 更新遊戲邏輯
		}

		initGame();

		// 清理函式
		return () => {
			if (gameRef.current) {
				gameRef.current.destroy(true);
			}
		};
	}, []);

	return <div id="phaser-game" />;
}

export default function GamePage() {
	return (
		<div>
			<h1>Phaser 遊戲</h1>
			<GameComponent />
		</div>
	);
}

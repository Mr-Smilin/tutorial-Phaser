import { useEffect, useRef } from "react";

const imageModules = import.meta.glob("../../../assets/gomoku/*.png", {
	eager: true,
	import: "default",
});
const images = Object.fromEntries(
	Object.entries(imageModules).map(([path, url]) => {
		const filename = path.split("/").pop().replace(".png", "");
		return [filename, url];
	})
);

function GameComponent() {
	const gameRef = useRef(null);

	useEffect(() => {
		// 確保在客戶端才執行
		if (typeof window === "undefined") return;

		let Phaser;
		const checkerboard = createCheckerboard();
		let self;
		// o 黑方 x 白方
		let status = "o";

		const initGame = async () => {
			const PhaserModule = await import("phaser");
			Phaser = PhaserModule.default || PhaserModule;

			const config = {
				type: Phaser.AUTO,
				width: 600,
				height: 600,
				backgroundColor: 0x705045,
				parent: "phaser-game",
				scene: { preload, create },
			};

			gameRef.current = new Phaser.Game(config);
		};

		function preload() {
			// 載入資源
			this.load.image("black", images?.black);
			this.load.image("white", images?.white);
		}

		function create() {
			// 建立遊戲物件
			let path = this.add.path(0, 15);
			let graphics = this.add.graphics();
			drawCheckerboard(graphics);

			self = this;
			this.input.on("pointerdown", putChess);
		}

		// 創建棋盤陣列
		function createCheckerboard() {
			let checkerboard = [];
			for (let i = 0; i < 20; i++) {
				checkerboard[i] = new Array();
				for (let j = 0; j < 20; j++) {
					checkerboard[i][j] = 0;
				}
			}
			return checkerboard;
		}

		// 繪製棋盤格線
		function drawCheckerboard(graphics) {
			graphics.lineStyle(1, 0xffffff, 1);
			for (let i = 0; i < 20; i++) {
				graphics.moveTo(0, 14.5 + i * 30);
				graphics.lineTo(600, 14.5 + i * 30);
			}
			for (let j = 0; j < 20; j++) {
				graphics.moveTo(14.5 + j * 30, 0);
				graphics.lineTo(14.5 + j * 30, 600);
			}
			graphics.strokePath();
		}

		// 下棋
		function putChess(pointer) {
			let i = Math.floor(pointer.y / 30);
			let j = Math.floor(pointer.x / 30);
			if (isEnpty(i, j)) {
				if (status === "o") {
					checkerboard[i][j] = "o";
					self.add.image(15 + j * 30, 15 + i * 30, "black");
				} else {
					checkerboard[i][j] = "x";
					self.add.image(15 + j * 30, 15 + i * 30, "white");
				}
				status = status === "o" ? "x" : "o";
			}
		}
		function isEnpty(i, j) {
			return checkerboard[i][j] === 0;
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
		<div className="game-container">
			<h1>五子棋</h1>
			<GameComponent />
			<p>tips:現行socket或PeerJS(WebRTC)都無法實現去server化連線</p>
			<p>失去了練習這個項目的本質需求，遊戲邏輯有空再完善。</p>
			<p>來源:https://ithelp.ithome.com.tw/articles/10208731</p>
		</div>
	);
}

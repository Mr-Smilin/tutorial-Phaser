import { useEffect, useRef } from "react";

const imageModules = import.meta.glob("../../../assets/game/*.png", {
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

		const initGame = async () => {
			const PhaserModule = await import("phaser");
			const Phaser = PhaserModule.default || PhaserModule;

			const config = {
				type: Phaser.AUTO,
				width: 800,
				height: 600,
				parent: "phaser-game",
				physics: {
					default: "arcade",
					arcade: {
						gravity: { y: 300 },
						debug: false,
					},
				},
				scene: { preload, create, update },
			};

			gameRef.current = new Phaser.Game(config);
		};

		let platforms;

		function preload() {
			// 載入資源
			this.load.image("sky", images?.sky);
			this.load.image("ground", images?.platform);
			this.load.image("star", images?.star);
			this.load.image("bomb", images?.bomb);
			this.load.spritesheet("dude", images?.dude, {
				frameWidth: 32,
				frameHeight: 48,
			});
		}

		function create() {
			// 建立遊戲物件
			this.add.image(0, 0, "sky").setOrigin(0, 0);

			platforms = this.physics.add.staticGroup();

			platforms
				.create(400, 568, "ground")
				// 縮放兩倍
				.setScale(2)
				// 告訴物理引擎更新物件體積
				.refreshBody();
			platforms.create(600, 400, "ground");
			platforms.create(50, 250, "ground");
			platforms.create(750, 220, "ground");
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
			<h1>Phaser Day3</h1>
			<GameComponent />
		</div>
	);
}

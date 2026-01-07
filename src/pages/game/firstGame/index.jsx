import { useEffect, useRef } from "react";

const imageModules = import.meta.glob("../../../assets/firstGame/*.png", {
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
		// 靜態物件們(可碰撞，不可移動)
		let platforms;
		// 玩家
		let player;
		// 鍵盤事件
		let cursors;
		// 星星
		let stars;
		// 炸彈
		let bombs;
		// 得分
		let score = 0;
		let scoreText;
		// 遊戲結束
		let gameOver = false;

		const initGame = async () => {
			const PhaserModule = await import("phaser");
			Phaser = PhaserModule.default || PhaserModule;

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

			stars = this.physics.add
				.group({
					key: "star",
					repeat: 11,
					setXY: { x: 0, y: 0, stepX: 70 },
				})
				.setOrigin(0, 0);

			stars.children.iterate(function (child) {
				child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
			});

			bombs = this.physics.add.group().setOrigin(0, 0);

			// 建立角色
			player = this.physics.add.sprite(100, 450, "dude");
			// 設定角色碰撞物體的彈跳幅度
			player.setBounce(0.2);
			// 設定角色碰到世界邊緣與靜態物件碰撞相同
			player.setCollideWorldBounds(true);

			this.anims.create({
				key: "left",
				frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
				frameRate: 10,
				repeat: -1, // 要循環播放
			});

			this.anims.create({
				key: "turn",
				frames: [{ key: "dude", frame: 4 }],
				frameRate: 20,
			});

			this.anims.create({
				key: "right",
				frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
				frameRate: 10,
				repeat: -1,
			});

			// 處理碰撞
			this.physics.add.collider(player, platforms);
			this.physics.add.collider(stars, platforms);
			this.physics.add.collider(bombs, platforms);
			this.physics.add.overlap(player, stars, collectStar, null, this);
			this.physics.add.collider(player, bombs, hitBomb, null, this);

			// 建立鍵盤事件讀取器
			cursors = this.input.keyboard.createCursorKeys();

			// 處理得分板
			scoreText = this.add.text(16, 16, "score: 0", {
				fontSize: "32px",
				fill: "#000",
			});
		}

		function update() {
			// 更新遊戲邏輯
			if (gameOver) {
				return;
			}
			if (cursors.left.isDown) {
				player.setVelocityX(-160);
				player.anims.play("left", true);
			} else if (cursors.right.isDown) {
				player.setVelocityX(160);
				player.anims.play("right", true);
			} else {
				player.setVelocityX(0);
				player.anims.play("turn");
			}
			if (cursors.up.isDown && player.body.touching.down) {
				player.setVelocityY(-330);
			}
		}

		// 玩家撿到星星的處理
		function collectStar(player, star) {
			// 左值為是否可見，右值為物理互動是否消除
			star.disableBody(true, true);

			score += 10;
			scoreText.setText("score: " + score);

			if (stars.countActive(true) === 0) {
				stars.children.iterate(function (child) {
					child.enableBody(true, child.x, 0, true, true);
				});

				// 確保炸彈不會生在角色旁邊
				const x =
					player.x < 400
						? Phaser.Math.Between(400, 800)
						: Phaser.Math.Between(0, 400);

				const bomb = bombs.create(x, 0, "bomb");
				bomb.setBounce(1);
				bomb.setCollideWorldBounds(true);
				bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
			}
		}

		// 玩家碰到炸彈的處理
		function hitBomb(player, bomb) {
			this.physics.pause();

			player.setTint(0xff0000);

			player.anims.play("turn");

			gameOver = true;
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
			<h1>Phaser</h1>
			<GameComponent />
		</div>
	);
}

import { useEffect, useRef } from "react";
import { createGlobalStyle } from "styled-components";
import css from "./style.css?raw";

const PageStyles = createGlobalStyle`${css}`;

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
		let self;
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
		// 觸控移動相關
		let isTouching = false;
		let touchStartY = 0;
		// 虛擬搖桿
		let joyStick;

		const initGame = async () => {
			const PhaserModule = await import("phaser");
			Phaser = PhaserModule.default || PhaserModule;

			const config = {
				type: Phaser.AUTO,
				scale: {
					mode: Phaser.Scale.FIT,
					parent: "phaser-game",
					autoCenter: Phaser.Scale.CENTER_BOTH,
					width: 800,
					height: 600,
				},
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
			self = this;
			// 載入資源
			self.load.image("sky", images?.sky);
			self.load.image("ground", images?.platform);
			self.load.image("star", images?.star);
			self.load.image("bomb", images?.bomb);
			self.load.spritesheet("dude", images?.dude, {
				frameWidth: 32,
				frameHeight: 48,
			});
		}

		function create() {
			// 建立遊戲物件
			self.add.image(0, 0, "sky").setOrigin(0, 0);

			platforms = self.physics.add.staticGroup();

			platforms
				.create(400, 568, "ground")
				// 縮放兩倍
				.setScale(2)
				// 告訴物理引擎更新物件體積
				.refreshBody();
			platforms.create(600, 400, "ground");
			platforms.create(50, 250, "ground");
			platforms.create(750, 220, "ground");

			stars = self.physics.add
				.group({
					key: "star",
					repeat: 11,
					setXY: { x: 0, y: 0, stepX: 70 },
				})
				.setOrigin(0, 0);

			stars.children.iterate(function (child) {
				child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
			});

			bombs = self.physics.add.group().setOrigin(0, 0);

			// 建立角色
			player = self.physics.add.sprite(100, 450, "dude");
			// 設定角色碰撞物體的彈跳幅度
			player.setBounce(0.2);
			// 設定角色碰到世界邊緣與靜態物件碰撞相同
			player.setCollideWorldBounds(true);

			self.anims.create({
				key: "left",
				frames: self.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
				frameRate: 10,
				repeat: -1, // 要循環播放
			});

			self.anims.create({
				key: "turn",
				frames: [{ key: "dude", frame: 4 }],
				frameRate: 20,
			});

			self.anims.create({
				key: "right",
				frames: self.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
				frameRate: 10,
				repeat: -1,
			});

			// 處理碰撞
			self.physics.add.collider(player, platforms);
			self.physics.add.collider(stars, platforms);
			self.physics.add.collider(bombs, platforms);
			self.physics.add.overlap(player, stars, collectStar, null, this);
			self.physics.add.collider(player, bombs, hitBomb, null, this);

			// 建立鍵盤事件讀取器
			cursors = self.input.keyboard.createCursorKeys();

			// 處理得分板
			scoreText = self.add.text(16, 16, "score: 0", {
				fontSize: "32px",
				fill: "#000",
			});

			// 處理點擊移動
			// 相對位置
			// moveByRelative();
			// 虛擬搖桿
			moveByJoy();
		}

		function update() {
			// 更新遊戲邏輯
			if (gameOver) {
				return;
			}

			// 只在桌面且沒有觸控時才用鍵盤
			if (!self.input.activePointer.isDown && !!cursors) {
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
			} else {
				handleJoy();
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
			self.physics.pause();

			player.setTint(0xff0000);

			player.anims.play("turn");

			gameOver = true;
		}

		// 透過相對位置觸控移動
		function moveByRelative() {
			// 觸控開始
			self.input.on(
				"pointerdown",
				function (pointer) {
					isTouching = true;
					touchStartY = pointer.y;
				},
				this
			);

			// 觸控移動
			self.input.on(
				"pointermove",
				function (pointer) {
					if (!isTouching) return;

					const screenWidth = self.cameras.main.width;
					const edgeThreshold = 100; // 邊緣判定區域寬度

					// 判定移動方向
					let direction = 0;

					if (pointer.x < edgeThreshold) {
						// 左邊緣固定判定
						direction = -1;
					} else if (pointer.x > screenWidth - edgeThreshold) {
						// 右邊緣固定判定
						direction = 1;
					} else {
						// 中間區域：根據相對角色位置判定
						direction = pointer.x > player.x ? 1 : -1;
					}

					if (direction === -1) {
						player.setVelocityX(-160);
						player.anims.play("left", true);
					} else if (direction === 1) {
						player.setVelocityX(160);
						player.anims.play("right", true);
					}

					// 判定是否為跳躍（垂直滑動超過閾值）
					const swipeDistance = Math.abs(pointer.y - touchStartY);
					if (swipeDistance > 30 && player.body.touching.down) {
						player.setVelocityY(-330);
					}
				},
				this
			);

			// 觸控結束
			self.input.on(
				"pointerup",
				function (pointer) {
					isTouching = false;

					player.setVelocityX(0);
					player.anims.play("turn");
				},
				this
			);
		}

		// 透過虛擬搖桿移動
		async function moveByJoy() {
			// 前端動態載入
			const rexVirtualJoystickModule = await import(
				"phaser3-rex-plugins/plugins/virtualjoystick.js"
			);
			const rexVirtualJoystick =
				rexVirtualJoystickModule.default || rexVirtualJoystickModule;
			// 新增虛擬搖桿
			joyStick = new rexVirtualJoystick(this, {
				x: 100,
				y: 500,
				radius: 50,
				base: self.add.circle(0, 0, 50, 0x888888, 0.5),
				thumb: self.add.circle(0, 0, 25, 0xcccccc, 0.8),
			});

			// 新增跳躍按鈕
			const jumpButton = self.add.circle(700, 500, 40, 0x888888, 0.5);
			jumpButton.setInteractive();

			self.add
				.text(700, 500, "↑", {
					fontSize: "32px",
					fill: "#fff",
				})
				.setOrigin(0.5);

			jumpButton.on("pointerdown", () => {
				if (player.body.touching.down && !gameOver) {
					player.setVelocityY(-330);
				}
			});
		}

		// 處理搖桿輸入
		function handleJoy() {
			if (joyStick) {
				const cursorKeys = joyStick.createCursorKeys();

				if (cursorKeys.left.isDown) {
					player.setVelocityX(-160);
					player.anims.play("left", true);
				} else if (cursorKeys.right.isDown) {
					player.setVelocityX(160);
					player.anims.play("right", true);
				} else {
					player.setVelocityX(0);
					player.anims.play("turn");
				}
			}
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
			<PageStyles />
			<h1>Phaser</h1>
			<GameComponent />
		</div>
	);
}

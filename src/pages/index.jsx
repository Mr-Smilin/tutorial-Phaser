import { createGlobalStyle } from "styled-components";
import { Link } from "react-router-dom";
import css from "./style.css?raw";

const PageStyles = createGlobalStyle`${css}`;

export default function HomePage() {
	const handleMouseMove = (e) => {
		const card = e.currentTarget;
		const rect = card.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		const rotateX = (y - centerY) / 10;
		const rotateY = (centerX - x) / 10;

		card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
	};

	const handleMouseLeave = (e) => {
		e.currentTarget.style.transform =
			"perspective(1000px) rotateX(0deg) rotateY(0deg)";
	};

	const links = [
		{
			to: "/app",
			title: "初始畫面",
			image:
				"https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
		},
		{
			to: "/game/firstGame",
			title: "吃星星",
			image:
				"https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
		},
		{
			to: "/game/gomoku",
			title: "五子棋",
		},
	];

	return (
		<>
			<PageStyles />
			<div className="home-container">
				<div className="cards-grid">
					{links.map((link, index) => (
						<Link
							key={index}
							to={link.to}
							className="card"
							onMouseMove={handleMouseMove}
							onMouseLeave={handleMouseLeave}
						>
							<div
								className="card-image"
								style={{ backgroundImage: `url(${link.image})` }}
							/>
							<div className="card-content">
								<h3>{link.title}</h3>
							</div>
						</Link>
					))}
				</div>
			</div>
		</>
	);
}

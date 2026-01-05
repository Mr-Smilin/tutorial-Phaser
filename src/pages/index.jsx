import { Link } from "react-router-dom";

export default function HomePage() {
	return (
		<div>
			<h3>
				<Link to="/app">app</Link>
			</h3>
			<h3>
				<Link to="/game/day1">day1</Link>
			</h3>
		</div>
	);
}

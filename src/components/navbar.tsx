import { Link } from 'react-router-dom'
import styles from './navbar.module.css'

export default function Navbar() {
	return (
		<header className={styles.header}>
			<nav className={styles.nav}>
				<div className={styles.brand}>Devan Bait</div>
				<ul className={styles.links}>
					<li><Link to="/">Home</Link></li>
				</ul>
			</nav>
		</header>
	)
}

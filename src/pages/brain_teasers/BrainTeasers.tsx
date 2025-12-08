import styles from './BrainTeasers.module.css'
import { Link } from 'react-router-dom'

export default function BrainTeasers() {
  return (
    <section className={styles.container}>
      <div className={styles.pageTitle}>Brain Teasers</div>
      <div className={styles.wrap}>
        <div className={styles.content}>
          <p className={styles.subtitle}>Pick a test to begin:</p>
          <div className={styles.grid}>
          <Link to="/games/brain-teasers/basic-vibe-literacy" className={styles.card}>
            <div className={styles.cardTitle}>Basic Vibe Literacy</div>
          </Link>
          <Link to="/games/brain-teasers/dont-overthink-it" className={styles.card}>
            <div className={styles.cardTitle}>Don't Overthink It</div>
          </Link>
          <Link to="/games/brain-teasers/are-you-chill" className={styles.card}>
            <div className={styles.cardTitle}>Are you chill?</div>
          </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

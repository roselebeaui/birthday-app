import styles from './VibeTest.module.css'

export default function VibeTest() {
  return (
    <section className={styles.container}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>The Vibe Test</h1>
        <p className={styles.subtitle}>10-question quiz coming soon. We’ll wire the questions next.</p>
        <div className={styles.placeholder}>Ready when you are with the prompts ✨</div>
      </div>
    </section>
  )
}

import styles from './LoversGallery.module.css'
import { useMemo } from 'react'

export default function LoversGallery() {
  const images = useMemo(() => {
    // Load all common image extensions from src/assets/lovers_photos
    const mods = import.meta.glob('../../assets/lovers_photos/*.{png,jpg,jpeg,gif,webp}', { eager: true, import: 'default' }) as Record<string, string>
    return Object.values(mods)
  }, [])

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>The Cave of Two Lovers</h1>
      {images.length === 0 ? (
        <div className={styles.empty}>No photos found in assets/lovers_photos</div>
      ) : (
        <div className={styles.grid}>
          {images.map((src, i) => (
            <div key={i} className={styles.item}>
              <img src={src} alt={`Lovers ${i+1}`} className={styles.image} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

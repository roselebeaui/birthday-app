import logo from '../../assets/logos/Devan_Birthday.png'
import styles from './Home.module.css'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const placeholders = [
  'Ranking Gross Food',
  'Block Runner',
  'Trivia Challenge',
  'Photo Puzzle',
  'Word Scramble',
  'Guess The Year',
]

export default function Home() {
  const navigate = useNavigate()
  const [showScare, setShowScare] = useState(false)
  // Load scare face image(s) from assets/scary_photos; pick the first image file
  const scareImage = useMemo(() => {
    const pngs = import.meta.glob('../../assets/scary_photos/*.png', { eager: true, import: 'default' }) as Record<string, string>
    const jpgs = import.meta.glob('../../assets/scary_photos/*.jpg', { eager: true, import: 'default' }) as Record<string, string>
    const jpegs = import.meta.glob('../../assets/scary_photos/*.jpeg', { eager: true, import: 'default' }) as Record<string, string>
    const gifs = import.meta.glob('../../assets/scary_photos/*.gif', { eager: true, import: 'default' }) as Record<string, string>
    const values = [
      ...Object.values(pngs),
      ...Object.values(jpgs),
      ...Object.values(jpegs),
      ...Object.values(gifs),
    ]
    return values[0] || ''
  }, [])
  // Load jump scare audio (mp3) from assets/scary_photos; pick the first one
  const scareAudio = useMemo(() => {
    const modules = import.meta.glob('../../assets/scary_photos/*.mp3', { eager: true, import: 'default' }) as Record<string, string>
    const values = Object.values(modules)
    return values[0] || ''
  }, [])

  useEffect(() => {
    if (showScare && scareAudio) {
      const audio = new Audio(scareAudio)
      audio.play().catch(() => {/* ignore play errors */})
      const timer = setTimeout(() => {
        audio.pause()
        audio.currentTime = 0
      }, 2000)
      return () => {
        clearTimeout(timer)
        audio.pause()
      }
    }
  }, [showScare, scareAudio])

  const onFlyClick = () => {
    // Show fullscreen scare image for ~2 seconds
    setShowScare(true)
    setTimeout(() => setShowScare(false), 2000)
  }

  const openFoodRanking = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Always run manual expand animation so route change happens AFTER the animation

    // Manual expand animation: animate a cloned overlay from card bounds to fullscreen, then navigate
    const target = (e.currentTarget as HTMLElement).querySelector('[data-vtn="food-ranking"]') as HTMLElement | null
    const rect = target?.getBoundingClientRect()
    if (rect) {
      const overlay = document.createElement('div')
      overlay.style.position = 'fixed'
      overlay.style.left = `${rect.left}px`
      overlay.style.top = `${rect.top}px`
      overlay.style.width = `${rect.width}px`
      overlay.style.height = `${rect.height}px`
      overlay.style.borderRadius = getComputedStyle(target!).borderRadius || '12px'
      overlay.style.background = 'rgba(255,255,255,0.85)'
      overlay.style.backdropFilter = 'blur(6px)'
      overlay.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      overlay.style.zIndex = '9999'
      overlay.style.transform = 'scale(0.98)'
      overlay.style.opacity = '0.0'
      overlay.style.transition = 'left 2s cubic-bezier(0.2, 0.8, 0.2, 1), top 2s cubic-bezier(0.2, 0.8, 0.2, 1), width 2s cubic-bezier(0.2, 0.8, 0.2, 1), height 2s cubic-bezier(0.2, 0.8, 0.2, 1), border-radius 2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 2s ease-in'
      document.body.appendChild(overlay)
      const prevPointerEvents = document.body.style.pointerEvents
      document.body.style.pointerEvents = 'none'

      // Force layout, then animate to fullscreen with subtle scale/opacity
      void overlay.offsetHeight
      overlay.style.left = '0px'
      overlay.style.top = '0px'
      overlay.style.width = '100vw'
      overlay.style.height = '100vh'
      overlay.style.borderRadius = '0px'
      overlay.style.transform = 'scale(1.0)'
      overlay.style.opacity = '1'

      const cleanup = () => {
        overlay.remove()
        document.body.style.pointerEvents = prevPointerEvents
        // add slight delay after the expand finishes before routing
        setTimeout(() => navigate('/games/food-ranking'), 300)
      }
      overlay.addEventListener('transitionend', cleanup, { once: true })
      // Fallback in case transitionend doesn’t fire
      setTimeout(cleanup, 2400)
    } else {
      navigate('/games/food-ranking')
    }
  }
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        {showScare && (
          <div className={styles.scareOverlay}>
            <img src={scareImage} alt="Scare Face" className={styles.scareImage} />
          </div>
        )}
        {/* Background flying container behind all components */}
        <div className={styles.flyer} aria-hidden>
          <div className={styles.flyItem} onClick={onFlyClick}>Catch Me!</div>
        </div>
        <img src={logo} alt="Devan Bait" className={styles.logo} />
        <div className={styles.cards} aria-hidden>
          <div className={styles.ring}>
            {placeholders.map((label) => (
              <div key={label} className={styles.card}>
                {label === 'Ranking Gross Food' ? (
                  <div
                    className={styles.cardInner}
                    data-vtn="food-ranking"
                    onClick={openFoodRanking}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') openFoodRanking(ev as any) }}
                    style={{ cursor: 'pointer' }}
                  >
                    {label}
                  </div>
                ) : label === 'Block Runner' ? (
                  <div
                    className={styles.cardInner}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/games/block-runner')}
                    onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') navigate('/games/block-runner') }}
                    style={{ cursor: 'pointer' }}
                  >
                    {label}
                  </div>
                ) : (
                  <div className={styles.cardInner}>{label}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

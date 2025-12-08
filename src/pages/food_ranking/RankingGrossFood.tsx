import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './RankingGrossFood.module.css'

// Load all images placed under src/assets/food_ranking_photos
// Add your images there; supported by Vite's import.meta.glob
const useFoodImages = () => {
  const modules = import.meta.glob('../../assets/food_ranking_photos/*', { eager: true, import: 'default' }) as Record<string, string>
  return Object.values(modules)
}

type Slot = { rank: number, img?: string }

export default function RankingGrossFood() {
  const images = useFoodImages()
  const [started, setStarted] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [current, setCurrent] = useState<string | undefined>(undefined)
  const [slots, setSlots] = useState<Slot[]>(Array.from({ length: 10 }, (_, i) => ({ rank: i + 1 })))
  const [assigned, setAssigned] = useState<Record<string, number>>({}) // img -> rank
  const intervalRef = useRef<number | null>(null)
  const assignedRef = useRef<Record<string, number>>({})

  const remainingImages = useMemo(() => images.filter((src) => assigned[src] === undefined), [images, assigned])
  const remainingRanks = useMemo(() => slots.filter(s => !s.img).map(s => s.rank), [slots])

  const canStart = images.length > 0 && remainingImages.length > 0 && remainingRanks.length > 0

  useEffect(() => {
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }
  }, [])

  const startSpin = () => {
    if (!canStart) return
    setStarted(true)
    setSpinning(true)
    // cycle randomly for 2 seconds then stop on a random remaining image
    const endAt = Date.now() + 2000
    intervalRef.current = window.setInterval(() => {
      const liveRemaining = images.filter((src) => assignedRef.current[src] === undefined)
      if (liveRemaining.length === 0) {
        if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null }
        setSpinning(false)
        return
      }
      const idx = Math.floor(Math.random() * liveRemaining.length)
      setCurrent(liveRemaining[idx])
      if (Date.now() >= endAt) {
        if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null }
        // land on a final image
        const finalRemaining = images.filter((src) => assignedRef.current[src] === undefined)
        const finalIdx = Math.floor(Math.random() * finalRemaining.length)
        setCurrent(finalRemaining[finalIdx])
        setSpinning(false)
      }
    }, 80)
  }

  const assignRank = (rank: number) => {
    if (!current) return
    // rank must be empty and image not yet assigned
    const slotIdx = slots.findIndex(s => s.rank === rank)
    if (slotIdx < 0 || slots[slotIdx].img) return
    if (assigned[current] !== undefined) return

    const nextSlots = [...slots]
    nextSlots[slotIdx] = { ...nextSlots[slotIdx], img: current }
    setSlots(nextSlots)
    setAssigned(prev => ({ ...prev, [current]: rank }))
    assignedRef.current = { ...assignedRef.current, [current]: rank }

    // auto-spin again if any remain
    const nextRemainingImages = images.filter((src) => assignedRef.current[src] === undefined)
    const nextRemainingRanks = nextSlots.filter(s => !s.img).length
    if (nextRemainingImages.length > 0 && nextRemainingRanks > 0) {
      setTimeout(() => startSpin(), 400)
    } else {
      setCurrent(undefined)
    }
  }

  const allFilled = remainingRanks.length === 0

  return (
    <section className={styles.wrapper}>
      <h1 className={styles.title}>Ranking Gross Food</h1>
      {/* Overlay ranking containers independent from page layout */}
      <aside className={styles.overlaySlots} aria-label="Ranking slots">
        <div className={styles.slots}>
          {slots.map((slot) => {
            const isEmpty = !slot.img
            const selectable = !!current && isEmpty
            return (
              <div
                key={slot.rank}
                className={`${styles.slot} ${selectable ? styles.selectable : ''}`}
                onClick={() => selectable && assignRank(slot.rank)}
                aria-disabled={!selectable}
              >
                <span className={styles.slotLabel}>{slot.rank}</span>
                {slot.img ? (
                  <img src={slot.img} alt={`Rank ${slot.rank}`} />
                ) : null}
              </div>
            )
          })}
        </div>
      </aside>
      <div className={styles.stage}>
        <div className={styles.photoGroup}>
          <div className={styles.photoBox} data-view-transition-name="fr-photo">
            {current ? (
              <img src={current} alt="Random food" />
            ) : started ? (
              <div style={{height:'100%'}}></div>
            ) : (
              <div className={styles.placeholder}>Press Start to begin</div>
            )}
          </div>
          <div className={styles.spinRow}>
            <button className={styles.button} onClick={startSpin} disabled={!canStart || spinning || allFilled}>
              {started ? (spinning ? 'Spinning…' : 'Spin Again') : 'Start'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

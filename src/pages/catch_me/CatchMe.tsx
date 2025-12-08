import styles from './CatchMe.module.css'
import { useEffect, useRef, useState } from 'react'
import scaryImg from '../../assets/scary_photos/scary_face.jpg'
import jumpMp3 from '../../assets/scary_photos/jump_scare.mp3'

export default function CatchMe() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const play = () => {
      a.currentTime = 0
      a.play().catch(() => {/* ignored */})
    }
    // Try autoplay in case navigation counts as a gesture
    play()
    // Fallback: also play on first click
    const handler = () => { play(); window.removeEventListener('click', handler) }
    window.addEventListener('click', handler)
    const onEnded = () => { setVisible(false) }
    a.addEventListener('ended', onEnded)
    // Safety timeout in case 'ended' doesn't fire
    window.setTimeout(() => setVisible(false), 7000)
    return () => {
      window.removeEventListener('click', handler)
      a.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <div className={styles.fullscreen}>
      {visible && <img src={scaryImg} alt="Gotcha!" className={styles.img} />}
      <audio ref={audioRef} src={jumpMp3} autoPlay />
    </div>
  )
}

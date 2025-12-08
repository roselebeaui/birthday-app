import styles from './WordGuess.module.css'
import { useEffect, useRef, useState } from 'react'
import scaryImg from '../../assets/scary_photos/scary_face.jpg'
import jumpMp3 from '../../assets/scary_photos/jump_scare.mp3'

type Mark = 'correct'|'present'|'absent'

// Optional dictionary (not currently enforced)
// const DICT = ['HAPPY','PARTY','CAKES','SMILE','LAUGH','GIFTS','CANDY','APPLE','MUSIC','DANCE','ALLEY','OTHER','WORLD','GUESS','WORDS']
// Secret words list (variable lengths supported)
const WORDS = ['GOONMAXING','MUNTING','SIGMA','BUSSIN','EDGING','MEWING','GYATT','RIZZLER','SKIBIDI']

function scoreGuess(guess: string, answer: string): Mark[] {
  const L = answer.length
  const marks: Mark[] = Array(L).fill('absent')
  const freq: Record<string, number> = {}
  for (let i = 0; i < L; i++) freq[answer[i]] = (freq[answer[i]]||0) + 1
  for (let i = 0; i < L; i++) {
    if (guess[i] === answer[i]) { marks[i] = 'correct'; freq[guess[i]]!-- }
  }
  for (let i = 0; i < L; i++) {
    if (marks[i] === 'correct') continue
    const ch = guess[i]
    if (freq[ch] > 0) { marks[i] = 'present'; freq[ch]!-- } else { marks[i] = 'absent' }
  }
  return marks
}

export default function WordGuess() {
  const [answer] = useState(() => WORDS[Math.floor(Math.random()*WORDS.length)])
  const [grid, setGrid] = useState<string[]>(Array(6).fill(''))
  const [marks, setMarks] = useState<Mark[][]>(Array(6).fill([]))
  const [row, setRow] = useState(0)
  const [status, setStatus] = useState('')
  // removed keyboard hint state for now
  const [entry, setEntry] = useState('')
  const [message, setMessage] = useState('')
  const [showScare, setShowScare] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const KEY_ROWS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','BKSP']
  ]
  const [keyStates, setKeyStates] = useState<Record<string, Mark | undefined>>({})

  const applyKeyStatesFromMarks = (guess: string, m: Mark[]) => {
    const priority: Record<Mark, number> = { absent: 0, present: 1, correct: 2 }
    setKeyStates(prev => {
      const next = { ...prev }
      for (let i = 0; i < guess.length; i++) {
        const ch = guess[i]
        const mk = m[i]
        const prevMk = next[ch]
        if (!prevMk || priority[mk] > priority[prevMk]) next[ch] = mk
      }
      return next
    })
  }

  const submitGuess = () => {
    if (status) return
    const guess = entry.trim().toUpperCase()
    const answerLen = answer.length
    if (guess.length !== answerLen || !new RegExp(`^[A-Z]{${answerLen}}$`).test(guess)) return
    // Accept any 5-letter A–Z guess; no dictionary gate.
    setGrid(prev => { const next = prev.slice(); next[row] = guess; return next })
      const m = scoreGuess(guess, answer)
      setMarks(prev => { const next = prev.slice(); next[row] = m; return next })
      applyKeyStatesFromMarks(guess, m)
      setMessage('')
      // keyboard hint UI omitted in this variant
      if (guess === answer) { setStatus('You got it! 🎉'); return }
      if (row === 5) { setStatus(`Answer: ${answer}`); return }
      setRow(r => r+1)
      setEntry('')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (status) return
      const key = e.key
      if (key === 'Enter') { submitGuess(); e.preventDefault(); return }
      if (key === 'Backspace') { setEntry(prev => prev.slice(0, -1)); e.preventDefault(); return }
      if (/^[a-zA-Z]$/.test(key)) {
        setEntry(prev => (prev.length < answer.length ? (prev + key.toUpperCase()) : prev))
        e.preventDefault();
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [entry, row, status])

  useEffect(() => {
    if (!showScare) return
    const a = audioRef.current
    if (!a) return
    const play = () => { a.currentTime = 0; a.play().catch(() => {}) }
    play()
    const onEnded = () => setShowScare(false)
    a.addEventListener('ended', onEnded)
    const safety = window.setTimeout(() => setShowScare(false), 7000)
    return () => { a.removeEventListener('ended', onEnded); window.clearTimeout(safety) }
  }, [showScare])

  // keyboard state retained for future visual hints, currently unused

  return (
    <section className={styles.container}>
      <aside className={styles.rulesPanel}>
          <div className={styles.rulesTitle}>How To Play</div>
          <div className={styles.ruleItem}>- Guess the 5-letter word in up to 6 tries.</div>
          <div className={styles.ruleItem}>- Use the on-screen or physical keyboard to enter letters.</div>
          <div className={styles.ruleItem}>- After submitting, tiles color:</div>
          <div className={styles.ruleItem}>• Green: letter is correct and in the right spot.</div>
          <div className={styles.ruleItem}>• Yellow: letter is in the word, wrong spot.</div>
          <div className={styles.ruleItem}>• Gray: letter is not in the word.</div>
          <div className={styles.ruleHint}>Duplicate letters are handled: greens first, then yellows.</div>
          <div className={styles.ruleHint} style={{ marginTop: 10 }}>
            Feeling like you're just not smart enough to guess the word?
            Click <button onClick={() => setShowScare(true)} style={{ color: '#ffd54f', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer' }}>here</button> to see the secret word.
          </div>
      </aside>
      <div className={styles.layout}>
        <div>
          <div className={styles.pageTitle}>Brainrot Wordle</div>
          <div className={styles.board}>
          {Array.from({ length: 6 }, (_, r) => (
            <div key={r} className={styles.row} style={{ gridTemplateColumns: `repeat(${answer.length}, 56px)` }}>
              {Array.from({ length: answer.length }, (_, c) => {
                const isCurrent = r === row && !marks[r]?.length && !status
                const ch = isCurrent ? (entry[c] || '') : (grid[r][c] || '')
                const mk = marks[r][c] as Mark | undefined
                const revealed = Boolean(marks[r]?.length)
                const className = [
                  styles.tile,
                  revealed ? styles.revealed : '',
                  mk ? styles[mk] : ''
                ].filter(Boolean).join(' ')
                return <div key={c} className={className}>{ch}</div>
              })}
            </div>
          ))}
          </div>
        <div className={styles.keyboard}>
          {KEY_ROWS.map((rowKeys, idx) => (
            <div className={styles.krow} key={idx}>
              {rowKeys.map(k => {
                if (k === 'ENTER') {
                  return <button key={k} className={`${styles.key} ${styles.wide}`} onClick={submitGuess}>Enter</button>
                }
                if (k === 'BKSP') {
                  return <button key={k} className={`${styles.key} ${styles.small}`} onClick={() => setEntry(prev => prev.slice(0,-1))}>⌫</button>
                }
                const mk = keyStates[k]
                const className = [styles.key, mk ? styles[mk] : ''].filter(Boolean).join(' ')
                const disabled = mk === 'absent'
                return (
                  <button
                    key={k}
                    className={className}
                    disabled={disabled}
                    onClick={() => setEntry(prev => (prev.length < answer.length ? (prev + k) : prev))}
                  >{k}</button>
                )
              })}
            </div>
          ))}
        </div>
        {message && (<div className={styles.status}>{message}</div>)}
        {status && (<div className={styles.status}>{status}</div>)}
        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={submitGuess}>Enter</button>
          <button className={styles.button} onClick={() => { location.reload() }}>New Game</button>
        </div>
        </div>
      </div>
      {showScare && (
        <div className={styles.scareOverlay}>
          <img src={scaryImg} alt="Gotcha!" className={styles.scareImg} />
          <audio ref={audioRef} src={jumpMp3} autoPlay />
        </div>
      )}
    </section>
  )
}

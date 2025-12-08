import styles from './Test.module.css'
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
type Q = { prompt: string; options: string[]; correctIndex: number; special?: 'delay-like' | 'click-real' }
const QUESTIONS: Q[] = [
  {
    prompt: 'Someone texts you “lol ok” and then immediately stops typing. No follow-up. No context. Just that. What’s your move, assuming you don’t want to make this worse?',
    options: ['Lol', 'Okay', 'What do you mean by that', '👍'],
    correctIndex: 1,
  },
  {
    prompt: 'The prompt says “be chill.” This is not a trick, but it is not as literal as it looks. Respond accordingly.',
    options: ['Chill', 'Okay', 'Bet', 'Be'],
    correctIndex: 3,
  },
  {
    prompt: 'Are you annoyed right now, even a little bit, or are you simply noticing that this question exists?',
    options: ['Yes', 'No', 'Kinda', 'Doesn’t matter'],
    correctIndex: 3,
  },
  {
    prompt: 'This question is, objectively speaking, unnecessary. You can agree, disagree, or choose not to engage with that framing at all.',
    options: ['True', 'False', 'I agree', 'Okay'],
    correctIndex: 3,
  },
  {
    prompt: 'Don’t do too much here. That includes tone, implication, or additional meaning that no one asked for.',
    options: ['Fine', 'Whatever', 'Got it', 'Don’t'],
    correctIndex: 3,
  },
  {
    prompt: 'People who are actually chill rarely announce it, prove it, or check in with themselves about it in real time. Keeping all of that in mind, select the answer that reacts the least to this sentence existing.',
    options: ['For sure', 'Makes sense', 'Okay', 'I get it'],
    correctIndex: 2,
  },
  {
    prompt: 'Someone tells you, directly or indirectly, that you might be overthinking things. This may or may not be true.',
    options: ['No I’m not', 'Maybe', 'Whatever', 'Okay'],
    correctIndex: 3,
  },
  {
    prompt: 'This question doesn’t look difficult, but it causes a surprising number of people to pause longer than they need to. Choose carefully.',
    options: ['This', 'Question', 'Causes', 'People'],
    correctIndex: 0,
  },
  {
    prompt: 'You don’t need to respond to everything you’re presented with. In fact, most things don’t require a response at all.',
    options: ['Cool', 'Bet', '👍', 'Ignore this'],
    correctIndex: 2,
    special: 'delay-like',
  },
  {
    prompt: 'Be real for a second. Not in a dramatic way. Just honestly, quietly real.',
    options: ['Yes', 'No', 'Probably', 'Okay'],
    correctIndex: -1,
    special: 'click-real',
  },
]

export default function AreYouChill() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  
  const [delayReady, setDelayReady] = useState(false)
  const current = useMemo(() => QUESTIONS[idx], [idx])

  useEffect(() => {
    setSelected(null)
    
    setDelayReady(false)
    if (current.special === 'delay-like') {
      const t = setTimeout(() => setDelayReady(true), 3000)
      return () => clearTimeout(t)
    }
  }, [idx])

  const advance = () => {
    const next = idx + 1
    if (next >= QUESTIONS.length) {
      setDone(true)
    } else {
      setIdx(next)
      setSelected(null)
      
    }
  }

  const choose = (i: number) => {
    if (done) return
    setSelected(i)

    // Special logic for Q9 (delay-like): option C only valid after 3s
    if (current.special === 'delay-like') {
      const isThumbsUp = i === 2
      const correctNow = isThumbsUp && delayReady
      if (correctNow) {
        setScore((s) => s + 1)
        setTimeout(advance, 600)
        return
      } else {
        // treat as wrong if not delayReady or any other option
        
        setWrongCount((c) => {
          const nc = c + 1
          if (nc >= 2) {
            setTimeout(() => { setDone(true); setFailed(true) }, 600)
          } else {
            setTimeout(() => setSelected(null), 600)
          }
          return nc
        })
        return
      }
    }

    // Special logic for Q10 (click-real): only clicking the word "real" counts as correct
    if (current.special === 'click-real') {
      // Any option selection is wrong
      
      setWrongCount((c) => {
        const nc = c + 1
        if (nc >= 2) {
          setTimeout(() => { setDone(true); setFailed(true) }, 600)
        } else {
          setTimeout(() => setSelected(null), 600)
        }
        return nc
      })
      return
    }

    // Normal questions
    const correct = i === current.correctIndex
    if (correct) {
      setScore((s) => s + 1)
      setTimeout(advance, 600)
    } else {
      
      setWrongCount((c) => {
        const nc = c + 1
        if (nc >= 2) {
          setTimeout(() => { setDone(true); setFailed(true) }, 600)
        } else {
          setTimeout(() => setSelected(null), 600)
        }
        return nc
      })
    }
  }

  const clickReal = () => {
    if (done) return
    if (current.special !== 'click-real') return
    setScore((s) => s + 1)
    setTimeout(advance, 600)
  }

  const restart = () => {
    setIdx(0); setSelected(null); setScore(0); setDone(false); setFailed(false); setWrongCount(0); setDelayReady(false)
  }

  return (
    <section className={styles.container}>
      <div className={styles.wrap}>
        <div className={styles.pageTitle}>
          <span>Are You Chill?</span>
          <Link to="/games/brain-teasers" className={styles.backLink}>← Return to Brain Teasers</Link>
        </div>
        {!done ? (
          <>
            <div className={styles.promptRow}>
              <span className={styles.progressCircle}>{idx+1}</span>
              <div className={styles.prompt}>
                {current.prompt.replace('real', '')}
                {current.special === 'click-real' ? (
                  <span onClick={clickReal} style={{cursor:'pointer', textDecoration:'underline'}}>real</span>
                ) : null}
              </div>
            </div>
            <div className={styles.answersGrid}>
              {current.options.map((opt, i) => {
                const isCorrect = i === current.correctIndex
                const isSel = selected === i
                const stateClass = selected === null ? '' : (isSel ? (isCorrect ? styles.correct : styles.wrong) : '')
                return (
                  <button key={i} onClick={() => choose(i)} className={`${styles.answerBtn} ${stateClass}`}>
                    <strong>{String.fromCharCode(65+i)}.</strong> {opt}
                  </button>
                )
              })}
            </div>
            <div className={styles.xMarks}>
              <span className={`${styles.x} ${wrongCount >= 1 ? styles.red : ''}`}></span>
              <span className={`${styles.x} ${wrongCount >= 2 ? styles.red : ''}`}></span>
            </div>
          </>
        ) : (
          <div className={styles.endScreen}>
            <div className={styles.endTitle}>{failed ? 'Out of lives!' : 'Complete!'}</div>
            <div className={styles.endSummary}>
              {failed ? (
                <>You reached question {idx+1} with {score} correct. Want to try again?</>
              ) : (
                <>You finished with {score} / {QUESTIONS.length}. Want to try again?</>
              )}
            </div>
            <div className={styles.endActions}>
              <button onClick={restart} className={styles.retakeBtn}>Retake</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

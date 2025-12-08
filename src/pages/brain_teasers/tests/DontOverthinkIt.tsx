import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Test.module.css'

type Q = { prompt: string; options: string[]; correctIndex: number }

const QUESTIONS: Q[] = [
  { prompt: 'Pick one.', options: ['One', 'Two', 'Three', 'Four'], correctIndex: 0 },
  { prompt: "Don't overthink this.", options: ['This', 'That', 'It', "Don't"], correctIndex: 3 },
  { prompt: 'This is question 3.', options: ['One', 'Two', 'Three', 'Four'], correctIndex: 2 },
  { prompt: 'Which answer are you supposed to click?', options: ['The correct one', 'This one', 'That one', "The one you're thinking about"], correctIndex: 3 },
  { prompt: 'Read this sentence carefully and then answer quickly.', options: ['Carefully', 'Sentence', 'Quickly', 'Read'], correctIndex: 2 },
  { prompt: 'The answer to this question is in the question.', options: ['Answer', 'Question', 'This', 'Is'], correctIndex: 0 },
  { prompt: 'Which option appears first?', options: ['First', 'Second', 'Third', 'Fourth'], correctIndex: 0 },
  { prompt: 'Stop thinking.', options: ['Okay', 'No', 'Stop', 'Thinking'], correctIndex: 2 },
  { prompt: 'This is where people mess up.', options: ['This', 'Is', 'Where', 'People'], correctIndex: 0 },
  { prompt: 'Seriously. Don\'t.', options: ['Continue', 'Overthink', 'Click', "Don't"], correctIndex: 3 },
]

export default function DontOverthinkIt() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  const current = useMemo(() => QUESTIONS[idx], [idx])

  const choose = (i: number) => {
    if (done) return
    setSelected(i)
    const correct = i === current.correctIndex
    if (correct) {
      setScore((s) => s + 1)
      
      setTimeout(() => {
        const next = idx + 1
        if (next >= QUESTIONS.length) {
          setDone(true)
        } else {
          setIdx(next)
          setSelected(null)
        }
      }, 600)
    } else {
      
      setWrongCount((c) => {
        const nc = c + 1
        if (nc >= 2) {
          setTimeout(() => {
            setDone(true)
            setFailed(true)
          }, 600)
        } else {
          setTimeout(() => setSelected(null), 600)
        }
        return nc
      })
    }
  }

  const restart = () => {
    setIdx(0); setSelected(null); setScore(0); setDone(false); setFailed(false); setWrongCount(0)
  }

  return (
    <section className={styles.container}>
      <div className={styles.wrap}>
        <div className={styles.pageTitle}>
          <span>Don't Overthink It</span>
          <Link to="/games/brain-teasers" className={styles.backLink}>← Return to Brain Teasers</Link>
        </div>
        {!done ? (
          <>
            <div className={styles.promptRow}>
              <span className={styles.progressCircle}>{idx+1}</span>
              <div className={styles.prompt}>{current.prompt}</div>
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

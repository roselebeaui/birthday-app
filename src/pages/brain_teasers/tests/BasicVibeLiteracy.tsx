import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Test.module.css'

type Q = { prompt: string; options: string[]; correctIndex: number; why?: string }

const QUESTIONS: Q[] = [
  {
    prompt: 'Sometimes a question is less about what it’s asking, and more about how loudly it’s asking it. With that in mind, select the option that responds least.',
    options: ['I’m here', 'Okay', 'Sure', '…'],
    correctIndex: 3,
    why: 'Silence is the response that makes the least noise.',
  },
  {
    prompt: 'This question includes several familiar words, but familiarity is not helpful. Choose the answer that participates in the question without adding anything extra.',
    options: ['Skibidi', 'Rizz', 'Ohio', 'This'],
    correctIndex: 3,
    why: '“This” references the question directly without injecting content.',
  },
  {
    prompt: 'A correct answer does not always move forward. Sometimes it simply refuses to move backward. Consider that carefully before responding.',
    options: ['Advance', 'Stop', 'Wait', 'Reverse'],
    correctIndex: 2,
    why: 'Waiting neither advances nor reverses.',
  },
  {
    prompt: 'The test has noticed that you may be looking for patterns. This question contains one. Select the option that completes the pattern implied by the position of this question, not its wording.',
    options: ['One', 'Two', 'Three', 'Four'],
    correctIndex: 3,
    why: 'The pattern is the question number itself.',
  },
  {
    prompt: 'Which of the following answers feels like it belongs here the least, even if you can’t fully explain why?',
    options: ['That one', 'This one', 'One of these', 'None of them'],
    correctIndex: 1,
    why: '“This one” collapses meaning into a loop and contributes nothing.',
  },
  {
    prompt: 'A lot of people think this question is about skibidi, rizz, or Ohio. It is not. Those words are here to see if you’ll latch onto them anyway. Select the option that describes how you should be answering.',
    options: ['Seriously', 'Carefully', 'Casually', 'Quickly'],
    correctIndex: 1,
    why: 'The question explicitly warns about distraction and latching.',
  },
  {
    prompt: 'Not every option below is trying to be an answer. Some of them are just saying things. Identify the one that actually responds to the question.',
    options: ['That’s fair', 'Okay', 'I see', 'Correct'],
    correctIndex: 3,
    why: 'The prompt asks for identification. “Correct” is a resolution.',
  },
  {
    prompt: 'This question has already gone on longer than it needs to. The correct response acknowledges that without escalating further.',
    options: ['Anyways', 'Moving on', 'Sorry', 'Done'],
    correctIndex: 3,
    why: '“Done” ends without commentary. Others extend the interaction.',
  },
  {
    prompt: 'Which response below would make this conversation worse if spoken out loud at the wrong time?',
    options: ['Maybe', 'Fine', 'Whatever', 'Yes'],
    correctIndex: 2,
    why: 'It carries dismissal and escalates tension.',
  },
  {
    prompt: 'You’ve probably decided what kind of question this is by now. That decision may or may not help you. Choose the option that represents distance rather than intention.',
    options: ['Finish', 'End', 'Far', 'Close'],
    correctIndex: 2,
  },
]

export default function BasicVibeLiteracy() {
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
      
      // brief pause to show green state, then advance
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
          // show second X turning red before ending the quiz
          setTimeout(() => {
            setDone(true)
            setFailed(true)
          }, 600)
        } else {
          // stay on the same question; allow retry after showing first red X
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
          <span>Basic Vibe Literacy</span>
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

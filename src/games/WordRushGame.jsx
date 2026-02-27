import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getRushWords } from '../lib/textData'
import { audio } from '../lib/audio'

const GLOBAL_DUR = 60
const CIRCUMF    = 326.73

export default function WordRushGame({ onFinish }) {
  const poolRef      = useRef(getRushWords(300))
  const poolIdxRef   = useRef(0)
  const typedRef     = useRef('')
  const wordRef      = useRef('')
  const wordTimeRef  = useRef(3.0)
  const scoreRef     = useRef(0)
  const comboRef     = useRef(0)
  const maxComboRef  = useRef(0)
  const finishedRef  = useRef(false)

  const [started,   setStarted]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [word,      setWord]      = useState('')
  const [typed,     setTyped]     = useState('')
  const [score,     setScore]     = useState(0)
  const [combo,     setCombo]     = useState(0)
  const [globalT,   setGlobalT]   = useState(GLOBAL_DUR)
  const [ringPct,   setRingPct]   = useState(1)
  const [wordLimit, setWordLimit] = useState(3.0)
  const [flash,     setFlash]     = useState(null)
  const inputRef    = useRef(null)

  const nextWord = useCallback(() => {
    const pool = poolRef.current
    if (poolIdxRef.current >= pool.length) {
      poolRef.current = getRushWords(300)
      poolIdxRef.current = 0
    }
    const w = pool[poolIdxRef.current++]
    wordRef.current = w
    typedRef.current = ''
    setWord(w)
    setTyped('')
  }, [])

  useEffect(() => {
    nextWord()
    inputRef.current?.focus()
  }, [nextWord])

  // Word ring timer
  const wordStartRef = useRef(null)
  useEffect(() => {
    if (!started || done) return
    wordStartRef.current = performance.now()
    const dur = wordTimeRef.current * 1000
    let rafId
    const tick = (now) => {
      const frac = Math.max(0, 1 - (now - wordStartRef.current) / dur)
      setRingPct(frac)
      if (frac > 0) {
        rafId = requestAnimationFrame(tick)
      } else {
        // Time for this word ran out
        doFail()
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [word, started, done]) // eslint-disable-line

  // Global timer
  useEffect(() => {
    if (!started || done) return
    const id = setInterval(() => {
      setGlobalT(t => {
        const next = t - 1
        if (next <= 0) finishGame()
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [started, done]) // eslint-disable-line

  const doSuccess = useCallback(() => {
    scoreRef.current += 1
    comboRef.current += 1
    if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current

    // Every 5 completed words, tighten the limit by 0.15s down to 0.8s
    if (scoreRef.current % 5 === 0) {
      const nextLimit = Math.max(0.8, wordTimeRef.current - 0.15)
      wordTimeRef.current = nextLimit
    }

    setScore(scoreRef.current)
    setCombo(comboRef.current)
    setWordLimit(wordTimeRef.current)

    setFlash('ok')
    audio.rushCorrect()
    setTimeout(() => {
      setFlash(null)
      nextWord()
    }, 80)
  }, [nextWord])

  const doFail = useCallback(() => {
    comboRef.current = 0
    setCombo(0)
    setFlash('fail')
    audio.rushFail()
    setTimeout(() => {
      setFlash(null)
      nextWord()
    }, 120)
  }, [nextWord])

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setDone(true)
    audio.finish()
    onFinish({
      label: 'word rush · 60s',
      mainNum: scoreRef.current,
      mainUnit: 'words completed',
      stats: [
        { val: maxComboRef.current, lbl: 'Best Combo' },
        { val: scoreRef.current,    lbl: 'Words Correct' },
        { val: Math.round(scoreRef.current * 60 / GLOBAL_DUR), lbl: 'Words / Min' },
        { val: wordTimeRef.current.toFixed(2) + 's', lbl: 'Current Word Limit' },
      ],
      wpmHist: [],
      pbKey: 'tf_pb_wordrush',
      score: scoreRef.current,
    })
  }, [onFinish])

  const handleKey = useCallback((e) => {
    if (e.key === 'Tab') { e.preventDefault(); return }
    if (done) return

    if (!started && e.key.length === 1) setStarted(true)
    if (!started) return

    if (e.key === 'Backspace') {
      const next = typedRef.current.slice(0, -1)
      typedRef.current = next
      setTyped(next)
      return
    }

    // Space is an explicit skip/fail
    if (e.key === ' ') {
      doFail()
      return
    }

    if (e.key.length !== 1) return

    const next = typedRef.current + e.key
    typedRef.current = next
    setTyped(next)
    audio.keyCorrect()

    // Automatic completion when the final character matches
    if (next === wordRef.current) {
      doSuccess()
    }

    e.target.value = ''
  }, [started, done, doSuccess, doFail])

  const strokeOff = CIRCUMF * (1 - ringPct)
  const ringColor =
    ringPct > 0.5 ? 'var(--teal)'
    : ringPct > 0.2 ? 'var(--amber)'
    : 'var(--pink)'

  return (
    <div className="game-inner rush-inner">
      <div className="rush-top">
        <div className="rush-counter">
          <div className="rush-label">score</div>
          <div className="rush-value">{score}</div>
        </div>
        <div className="rush-counter">
          <div className="rush-label">combo</div>
          <div className="rush-value">{combo}</div>
        </div>
        <div className="rush-counter rush-counter-time">
          <div className="rush-label">time</div>
          <div className="rush-value">{globalT}</div>
        </div>
      </div>

      <div className="rush-arena">
        <div className="ring-wrap">
          <svg className="ring-svg" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="ring-track"    cx="60" cy="60" r="52" />
            <circle
              className="ring-progress"
              cx="60"
              cy="60"
              r="52"
              style={{ strokeDashoffset: strokeOff, stroke: ringColor }}
            />
          </svg>
          <div className="ring-center">
            <div className={`rush-word${flash === 'ok' ? ' rush-word-ok' : flash === 'fail' ? ' rush-word-fail' : ''}`}>
              {word.split('').map((c, i) => {
                let cls = 'rw pending'
                if (i < typed.length) cls = typed[i] === c ? 'rw ok' : 'rw err'
                return <span key={i} className={cls}>{c}</span>
              })}
            </div>
            <div className="rush-limit">{wordLimit.toFixed(2)}s</div>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        className="hidden-input"
        style={{ position: 'fixed' }}
        onKeyDown={handleKey}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  )
}

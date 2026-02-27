import React, { useState, useEffect, useCallback, useRef } from 'react'
import { generate } from '../lib/textData'
import { audio } from '../lib/audio'
import { useTypingSession } from '../hooks/useTypingSession'
import TypingText from '../components/TypingText'

export default function ClassicGame({ options, onFinish }) {
  const { dur, mode, punct, nums, custom } = options
  const [chars]    = useState(() => generate({ mode, dur, punct, nums, custom }).join(' ').split(''))
  const [revealed, setRevealed] = useState(false)
  const [running,  setRunning]  = useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const [timeLeft, setTimeLeft] = useState(dur)
  const [streak,   setStreak]   = useState(0)
  const [wpmHist,  setWpmHist]  = useState([])
  const [done,     setDone]     = useState(false)
  const finishedRef = useRef(false)
  const inputRef    = useRef(null)

  const { typed, cursorIdx, isDone, stats, typeChar, deleteChar, calcWPM } = useTypingSession(chars)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Countdown timer
  useEffect(() => {
    if (!running || done) return
    const id = setInterval(() => {
      setElapsed(e => {
        const next = e + 1
        setTimeLeft(dur - next)
        setWpmHist(h => [...h, calcWPM(next)])
        if (next >= dur) setDone(true)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, done, dur, calcWPM])

  // Fire results
  useEffect(() => {
    if (!done || finishedRef.current) return
    finishedRef.current = true
    audio.finish()
    const wpm = calcWPM(elapsed || 1)
    onFinish({
      label: `classic · ${dur}s`,
      mainNum: wpm,
      mainUnit: 'words per minute',
      stats: [
        { val: stats.accuracy + '%',                      lbl: 'Accuracy' },
        { val: `${stats.correct} / ${stats.incorrect}`,  lbl: 'Correct / Errors' },
        { val: calcWPM(elapsed || 1) + ' wpm',           lbl: 'Raw WPM' },
        { val: consistency(wpmHist) + '%',                lbl: 'Consistency' },
      ],
      wpmHist,
      pbKey: `tf_pb_classic_${dur}`,
      score: wpm,
    })
  }, [done]) // eslint-disable-line

  useEffect(() => { if (isDone && !finishedRef.current) setDone(true) }, [isDone])

  const handleKey = useCallback((e) => {
    if (e.key === 'Tab') { e.preventDefault(); return }

    // First real keypress only reveals the text and dismisses the overlay.
    if (!revealed && e.key !== 'Escape') {
      setRevealed(true)
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') e.preventDefault()
      return
    }

    if (done) return
    if (e.key === 'Backspace') { e.preventDefault(); deleteChar(); return }
    if (e.key.length !== 1) return
    if (!running) setRunning(true)
    const ok = e.key === chars[cursorIdx]
    typeChar(e.key)
    if (ok) { setStreak(s => s + 1); audio.keyCorrect() }
    else    { setStreak(0);          audio.keyWrong()   }
    if (e.key === ' ') audio.wordDone()
    e.target.value = ''
  }, [revealed, done, running, chars, cursorIdx, typeChar, deleteChar])

  const gameInnerClass = `game-inner${running ? ' game-inner--running' : ''}`

  const timerTone =
    timeLeft <= 5 ? ' timer-num--urgent'
    : timeLeft <= dur / 2 ? ' timer-num--warn'
    : ''

  return (
    <div className={gameInnerClass}>
      <div className="stats-row">
        <div className="stat-block stat-block--primary">
          <div className="stat-num stat-num--wpm">
            {running ? calcWPM(elapsed) : 0}
          </div>
          <div className="stat-lbl">wpm</div>
        </div>
        <div className="stat-block stat-block--secondary">
          <div className="stat-num stat-num--secondary">
            {stats.accuracy}
          </div>
          <div className="stat-lbl">accuracy</div>
        </div>
        <div className="stat-block stat-block--secondary">
          <div className="stat-num stat-num--secondary">
            {streak}
          </div>
          <div className="stat-lbl">streak</div>
        </div>
        <div className="stat-spacer" />
        <div className="timer-block">
          <div className={`timer-num${timerTone}`}>
            {timeLeft}
          </div>
          <div className="timer-track">
            <div className="timer-fill" style={{ width: `${(timeLeft / dur) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="typing-box" onClick={() => inputRef.current?.focus()}>
        {!revealed && (
          <div className="idle-overlay">
            start typing to begin
          </div>
        )}
        <TypingText chars={chars} typed={typed} cursorIdx={cursorIdx} />
        <input ref={inputRef} className="hidden-input" onKeyDown={handleKey}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
      </div>
      <div className="progress-line">
        <div className="progress-fill" style={{ width: `${(cursorIdx / chars.length) * 100}%` }} />
      </div>
      <p className="type-hint">click to focus · tab to restart · esc for menu</p>
    </div>
  )
}

function consistency(hist) {
  const h = hist.filter(w => w > 0)
  if (h.length < 2) return 100
  const mean = h.reduce((a, b) => a + b, 0) / h.length
  const sd = Math.sqrt(h.reduce((a, b) => a + (b - mean) ** 2, 0) / h.length)
  return Math.max(0, Math.round(100 - (sd / (mean || 1)) * 100))
}

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { generate } from '../lib/textData'
import { audio }    from '../lib/audio'
import { useTypingSession } from '../hooks/useTypingSession'
import TypingText from '../components/TypingText'

const MAX_LIVES = 3

export default function SurvivorGame({ options, onFinish }) {
  const { dur, mode, punct, nums, custom } = options

  const [chars]    = useState(() => generate({ mode, dur, punct, nums, custom }).join(' ').split(''))
  const [revealed, setRevealed] = useState(false)
  const [running,  setRunning]  = useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const [timeLeft, setTimeLeft] = useState(dur)
  const [streak,   setStreak]   = useState(0)
  const [wpmHist,  setWpmHist]  = useState([])
  const [lives,    setLives]    = useState(MAX_LIVES)
  const [done,     setDone]     = useState(false)
  const [note,     setNote]     = useState('')
  const livesRef   = useRef(MAX_LIVES)
  const finishedRef = useRef(false)
  const inputRef   = useRef(null)

  const { typed, cursorIdx, isDone, stats, typeChar, deleteChar, calcWPM, lastWordHasError } = useTypingSession(chars)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!running || done) return
    const id = setInterval(() => {
      setElapsed(e => {
        const next = e + 1
        setTimeLeft(dur - next)
        setWpmHist(h => [...h, calcWPM(next)])
        if (next >= dur) triggerFinish('survived!', livesRef.current)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, done, dur, calcWPM]) // eslint-disable-line

  const triggerFinish = useCallback((msg, remainingLives) => {
    if (finishedRef.current) return
    finishedRef.current = true
    setDone(true)
    setNote(msg)
    const wpm = calcWPM(elapsed || 1)
    if (remainingLives <= 0) { audio.gameOver() } else { audio.finish() }
    onFinish({
      label:    `survivor · ${dur}s`,
      mainNum:  wpm,
      mainUnit: 'words per minute',
      stats: [
        { val: `${remainingLives} / ${MAX_LIVES}`, lbl: 'Lives Left' },
        { val: stats.accuracy + '%',                lbl: 'Accuracy' },
        { val: `${stats.correct} / ${stats.incorrect}`, lbl: 'Correct / Errors' },
        { val: msg,                                 lbl: 'Outcome' },
      ],
      wpmHist,
      pbKey:   `tf_pb_survivor_${dur}`,
      score:   wpm,
    })
  }, [elapsed, stats, wpmHist, calcWPM, dur, onFinish])

  useEffect(() => { if (isDone && !finishedRef.current) triggerFinish('all words done!', livesRef.current) }, [isDone])

  const handleKey = useCallback((e) => {
    if (e.key === 'Tab') { e.preventDefault(); return }

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
    else    { setStreak(0);          audio.keyWrong() }

    if (e.key === ' ' && lastWordHasError()) {
      const next = livesRef.current - 1
      livesRef.current = next
      setLives(next)
      audio.lifeLost()
      if (next <= 0) setTimeout(() => triggerFinish('no lives left 💀', 0), 350)
    }

    if (e.key === ' ') audio.wordDone()
    e.target.value = ''
  }, [revealed, done, running, chars, cursorIdx, typeChar, deleteChar, lastWordHasError, triggerFinish])

  const timerFraction = timeLeft / dur
  const gameInnerClass = `game-inner${running ? ' game-inner--running' : ''}`

  return (
    <div className={gameInnerClass}>
      <div className="stats-row">
        <div className="stat-block">
          <div className={`stat-num${running ? ' accent' : ' faded'}`}>{running ? calcWPM(elapsed) : 0}</div>
          <div className="stat-lbl">wpm</div>
        </div>
        <div className="stat-block">
          <div className="stat-num small">{streak}</div>
          <div className="stat-lbl">streak</div>
        </div>

        <div className="lives-row">
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <span key={i} className={`heart${i >= lives ? ' lost' : ''}`}>❤️</span>
          ))}
        </div>

        <div className="stat-spacer" />
        <div className="timer-block">
          <div className={`timer-num${timeLeft <= 5 ? ' timer-num--urgent' : timeLeft <= dur / 2 ? ' timer-num--warn' : ''}`}>{timeLeft}</div>
          <div className="timer-track">
            <div className="timer-fill" style={{ width: `${timerFraction * 100}%` }} />
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
      <p className="type-hint">finish words with errors → lose a heart</p>
    </div>
  )
}

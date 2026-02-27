import React, { useState, useEffect, useCallback, useRef } from 'react'
import { generate } from '../lib/textData'
import { audio }    from '../lib/audio'
import { useTypingSession } from '../hooks/useTypingSession'
import TypingText from '../components/TypingText'

export default function ZenGame({ options, onFinish }) {
  const { mode, punct, nums, custom } = options

  const [chars]     = useState(() => generate({ mode, dur: 120, punct, nums, custom }).join(' ').split(''))
  const [revealed,  setRevealed]  = useState(false)
  const [running,   setRunning]   = useState(false)
  const [elapsed,   setElapsed]   = useState(0)
  const [streak,    setStreak]    = useState(0)
  const [done,      setDone]      = useState(false)
  const startRef    = useRef(null)
  const finishedRef = useRef(false)
  const inputRef    = useRef(null)

  const { typed, cursorIdx, isDone, stats, typeChar, deleteChar, calcWPM } = useTypingSession(chars)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Running elapsed clock
  useEffect(() => {
    if (!running || done) return
    startRef.current = startRef.current ?? Date.now()
    const id = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000))
    }, 500)
    return () => clearInterval(id)
  }, [running, done])

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setDone(true)
    audio.finish()
    const el  = elapsed || 1
    const wpm = calcWPM(el)
    onFinish({
      label:    'zen · untimed',
      mainNum:  wpm,
      mainUnit: 'words per minute',
      stats: [
        { val: stats.accuracy + '%', lbl: 'Accuracy' },
        { val: stats.correct,        lbl: 'Correct Chars' },
        { val: stats.incorrect,      lbl: 'Errors' },
        { val: el + 's',             lbl: 'Time Taken' },
      ],
      wpmHist: [],
      pbKey:   'tf_pb_zen',
      score:   wpm,
    })
  }, [elapsed, stats, calcWPM, onFinish])

  useEffect(() => { if (isDone) finish() }, [isDone, finish])

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

    if (!running) { setRunning(true); startRef.current = Date.now() }

    const ok = e.key === chars[cursorIdx]
    typeChar(e.key)
    if (ok) { setStreak(s => s + 1); audio.keyCorrect() }
    else    { setStreak(0);          audio.keyWrong() }
    e.target.value = ''
  }, [revealed, done, running, chars, cursorIdx, typeChar, deleteChar])

  const gameInnerClass = `game-inner${running ? ' game-inner--running' : ''}`

  return (
    <div className={gameInnerClass}>
      <div className="stats-row">
        <div className="stat-block">
          <div className={`stat-num${!running ? ' faded' : ' accent'}`}>{running ? calcWPM(elapsed) : 0}</div>
          <div className="stat-lbl">wpm</div>
        </div>
        <div className="stat-block">
          <div className={`stat-num${stats.accuracy >= 98 ? ' good' : ''}`}>{stats.accuracy}</div>
          <div className="stat-lbl">acc%</div>
        </div>
        <div className="stat-block">
          <div className="stat-num small">{streak}</div>
          <div className="stat-lbl">streak</div>
        </div>
        <div className="stat-spacer" />
        <div className="zen-time">{elapsed > 0 ? `${elapsed}s` : '—'}</div>
        {running && (
          <button className="btn-zen-finish" onClick={finish}>
            finish →
          </button>
        )}
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
      <p className="type-hint">no timer · type at your own pace · click finish when done</p>
    </div>
  )
}


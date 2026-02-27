import React, { useState, useEffect, useCallback, useRef } from 'react'
import { generate } from '../lib/textData'
import { audio }    from '../lib/audio'
import { useTypingSession } from '../hooks/useTypingSession'
import TypingText from '../components/TypingText'

export default function GhostGame({ options, onFinish }) {
  const { dur, mode, punct, nums, custom } = options

  const ghostWPM   = parseInt(localStorage.getItem(`tf_pb_classic_${dur}`) || '0', 10) || 45
  const ghostSpeed = (ghostWPM * 5) / 60 // chars per second

  const [chars]     = useState(() =>
    generate({ mode, dur, punct, nums, custom }).join(' ').split('')
  )
  const [revealed,  setRevealed]  = useState(false)
  const [running,   setRunning]   = useState(false)
  const [elapsed,   setElapsed]   = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(dur)
  const [streak,    setStreak]    = useState(0)
  const [wpmHist,   setWpmHist]   = useState([])
  const [ghostIdx,  setGhostIdx]  = useState(0)
  const [done,      setDone]      = useState(false)

  const finishedRef = useRef(false)
  const ghostTimerRef = useRef(null)
  const inputRef    = useRef(null)

  const { typed, cursorIdx, isDone, stats, typeChar, deleteChar, calcWPM } =
    useTypingSession(chars)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Ghost position: advance every 150ms by ghostSpeed * 0.15
  useEffect(() => {
    if (!running || done) return
    const id = setInterval(() => {
      setGhostIdx(idx => idx + ghostSpeed * 0.15)
    }, 150)
    ghostTimerRef.current = id
    return () => clearInterval(id)
  }, [running, done, ghostSpeed])

  // Main timer
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

  // Finish when text done via typing
  useEffect(() => {
    if (isDone && !finishedRef.current) {
      setDone(true)
    }
  }, [isDone])

  // Results + PB update
  useEffect(() => {
    if (!done || finishedRef.current) return
    finishedRef.current = true
    if (ghostTimerRef.current) clearInterval(ghostTimerRef.current)

    const wpm   = calcWPM(elapsed || 1)
    const ahead = cursorIdx - Math.floor(ghostIdx)

    const raceResult =
      ahead > 0 ? `you beat the ghost by ${ahead} chars`
      : ahead < 0 ? `ghost wins by ${-ahead} chars`
      : `it's a tie`

    // PB update: speed up ghost if player beats it
    const pbKey = `tf_pb_classic_${dur}`
    const prevPb = parseInt(localStorage.getItem(pbKey) || '0', 10) || 0
    if (wpm > prevPb) {
      localStorage.setItem(pbKey, String(wpm))
    }

    audio.finish()
    onFinish({
      label:    `ghost race · ${dur}s`,
      mainNum:  wpm,
      mainUnit: 'words per minute',
      stats: [
        { val: ghostWPM + ' wpm',    lbl: 'Ghost Speed (your PB)' },
        { val: stats.accuracy + '%', lbl: 'Accuracy' },
        { val: raceResult,           lbl: 'Race Result' },
        { val: `${stats.correct} / ${stats.incorrect}`, lbl: 'Correct / Errors' },
      ],
      wpmHist,
      pbKey,
      score: wpm,
    })
  }, [done, elapsed, cursorIdx, ghostIdx, stats, wpmHist, calcWPM, dur, ghostWPM, onFinish])

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

    if (!running) {
      setRunning(true)
    }

    const ok = e.key === chars[cursorIdx]
    typeChar(e.key)
    if (ok) { setStreak(s => s + 1); audio.keyCorrect() }
    else    { setStreak(0);          audio.keyWrong() }
    if (e.key === ' ') audio.wordDone()
    e.target.value = ''
  }, [revealed, done, running, chars, cursorIdx, typeChar, deleteChar])

  const total    = chars.length || 1
  const ghostPct = Math.min(100, (ghostIdx / total) * 100)
  const youPct   = Math.min(100, (cursorIdx / total) * 100)
  const delta    = cursorIdx - Math.floor(ghostIdx)

  const deltaLabel =
    delta > 0 ? `${delta} chars ahead`
    : delta < 0 ? `${-delta} chars behind`
    : 'even'

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
        <div className="stat-spacer" />
        <div className="timer-block">
          <div className={`timer-num${timeLeft <= 5 ? ' timer-num--urgent' : timeLeft <= dur / 2 ? ' timer-num--warn' : ''}`}>{timeLeft}</div>
          <div className="timer-track">
            <div className="timer-fill" style={{ width: `${(timeLeft / dur) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Race lanes as progress bars */}
      <div className="ghost-track">
        <div className="ghost-lane">
          <div className="ghost-bar-label">ghost · {ghostWPM} wpm</div>
          <div className="ghost-bar">
            <div className="ghost-bar-fill ghost" style={{ width: `${ghostPct}%` }} />
          </div>
        </div>
        <div className="ghost-lane">
          <div className="ghost-bar-label">you</div>
          <div className="ghost-bar">
            <div className="ghost-bar-fill you" style={{ width: `${youPct}%` }} />
          </div>
          <div
            className="ghost-delta"
            style={{ color: delta > 0 ? 'var(--teal)' : delta < 0 ? 'var(--pink)' : 'var(--muted)' }}
          >
            {deltaLabel}
          </div>
        </div>
      </div>

      <div className="typing-box" onClick={() => inputRef.current?.focus()}>
        {!revealed && (
          <div className="idle-overlay">
            start typing to begin
          </div>
        )}
        <TypingText chars={chars} typed={typed} cursorIdx={cursorIdx} ghostIdx={ghostIdx} />
        <input
          ref={inputRef}
          className="hidden-input"
          onKeyDown={handleKey}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      <div className="progress-line">
        <div className="progress-fill" style={{ width: `${youPct}%` }} />
      </div>
      <p className="type-hint">race your best classic score — the ghost always matches your PB</p>
    </div>
  )
}


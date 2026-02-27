import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { generate } from '../lib/textData'
import { audio } from '../lib/audio'
import { useTypingSession } from '../hooks/useTypingSession'
import TypingText from '../components/TypingText'

const PLAYER_COLOR  = '#5ee6c8'
const TRACK_LEN     = 500  // arbitrary units — progress 0..500
const DUR           = 90   // race lasts up to 90s

export default function CarRaceGame({ options, onFinish }) {
  const { mode, punct, nums, custom } = options

  // Text to type
  const [chars] = useState(() =>
    generate({ mode, dur: DUR, punct, nums, custom }).join(' ').split('')
  )

  // Personal-best based AI speeds
  const [aiBase, setAiBase] = useState(() => {
    const raw = localStorage.getItem('tf_pb_classic_30')
    const pb  = parseInt(raw || '0', 10) || 0
    if (pb > 0) {
      return [
        { name: 'Ace',   wpm: Math.round(pb * 1.10), color: '#f87196' },
        { name: 'Blaze', wpm: Math.round(pb * 0.80), color: '#fbbf24' },
        { name: 'Cruz',  wpm: Math.round(pb * 0.55), color: '#a78bfa' },
      ]
    }
    return [
      { name: 'Ace',   wpm: 65, color: '#f87196' },
      { name: 'Blaze', wpm: 45, color: '#fbbf24' },
      { name: 'Cruz',  wpm: 30, color: '#a78bfa' },
    ]
  })

  const aiBaseRef = useRef(aiBase)
  useEffect(() => { aiBaseRef.current = aiBase }, [aiBase])

  // Difficulty selector
  const [difficulty, setDifficulty] = useState('medium') // 'easy' | 'medium' | 'hard'
  const difficultyMult =
    difficulty === 'easy' ? 0.7 :
    difficulty === 'hard' ? 1.4 :
    1.0

  // Race state
  const [running,   setRunning]   = useState(false)
  const [revealed,  setRevealed]  = useState(false)
  const [elapsed,   setElapsed]   = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(DUR)
  const [wpmHist,   setWpmHist]   = useState([])
  const [done,      setDone]      = useState(false)
  const [raceOver,  setRaceOver]  = useState(false)
  const [winner,    setWinner]    = useState(null)
  const [playerPos, setPlayerPos] = useState(null)

  const [positions, setPositions] = useState({
    player: 0,
    Ace: 0,
    Blaze: 0,
    Cruz: 0,
  })

  const posRef      = useRef(positions)
  const elapsedRef  = useRef(elapsed)
  const statsRef    = useRef(null)
  const wpmHistRef  = useRef(wpmHist)
  const doneRef     = useRef(false)

  const inputRef  = useRef(null)
  const canvasRef = useRef(null)

  const triggerRef = useRef(() => {})

  const { typed, cursorIdx, isDone, stats, typeChar, deleteChar, calcWPM } =
    useTypingSession(chars)

  // Keep refs in sync
  useEffect(() => { posRef.current = positions }, [positions])
  useEffect(() => { elapsedRef.current = elapsed }, [elapsed])
  useEffect(() => { statsRef.current = stats }, [stats])
  useEffect(() => { wpmHistRef.current = wpmHist }, [wpmHist])

  // Auto-focus hidden input
  useEffect(() => { inputRef.current?.focus() }, [])

  // Draw race track whenever positions or base speeds change
  useLayoutEffect(() => {
    drawTrack(canvasRef.current, posRef.current, aiBaseRef.current, difficultyMult)
  }, [positions, aiBase, difficultyMult])

  // Core finish logic stored in a ref to avoid stale closures in intervals
  useEffect(() => {
    triggerRef.current = (winnerId) => {
      if (doneRef.current) return
      doneRef.current = true
      setDone(true)
      setRaceOver(true)
      setWinner(winnerId)

      const finalPositions = posRef.current
      const ranking = [
        { id: 'player', pos: finalPositions.player || 0 },
        ...aiBaseRef.current.map(c => ({ id: c.name, pos: finalPositions[c.name] || 0 })),
      ].sort((a, b) => b.pos - a.pos)

      const rank = ranking.findIndex(r => r.id === 'player') + 1
      setPlayerPos(rank || null)

      const finalElapsed = elapsedRef.current || 1
      const finalStats   = statsRef.current || stats
      const finalWpmHist = wpmHistRef.current || wpmHist
      const finalWpm     = calcWPM(finalElapsed || 1)

      if (winnerId === 'player') audio.personalBest()
      else audio.finish()

      setTimeout(() => {
        onFinish({
          label: 'car race · 90s',
          mainNum: finalWpm,
          mainUnit: 'words per minute',
          stats: [
            { val: (['1st', '2nd', '3rd', '4th'][rank - 1] || `${rank}th`), lbl: 'Your Position' },
            { val: winnerId === 'player' ? 'you' : winnerId,              lbl: 'Race Winner' },
            { val: (finalStats?.accuracy ?? stats.accuracy) + '%',        lbl: 'Accuracy' },
            {
              val: `${finalStats?.correct ?? stats.correct} / ${finalStats?.incorrect ?? stats.incorrect}`,
              lbl: 'Correct / Errors',
            },
          ],
          wpmHist: finalWpmHist,
          pbKey: 'tf_pb_carrace',
          score: finalWpm,
        })
      }, 2200)
    }
  }, [stats, wpmHist, calcWPM, onFinish])

  // AI movement
  useEffect(() => {
    if (!running || doneRef.current) return
    const id = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev }
        aiBaseRef.current.forEach(car => {
          const effectiveWpm = car.wpm * difficultyMult
          const baseStep = (effectiveWpm * 5) / 60 / 10 // chars per 100ms
          const variance = baseStep * 0.05 * (Math.random() * 2 - 1)
          const step = Math.max(0, baseStep + variance)
          next[car.name] = Math.min(TRACK_LEN, prev[car.name] + step)
        })

        // Check if any AI finished
        const finished = aiBaseRef.current.find(car => next[car.name] >= TRACK_LEN)
        if (finished && !doneRef.current) {
          triggerRef.current(finished.name)
        }

        posRef.current = next
        return next
      })
    }, 100)
    return () => clearInterval(id)
  }, [running, difficultyMult])

  // Player position — chars typed drives the car
  useEffect(() => {
    const progress = (cursorIdx / (chars.length || 1)) * TRACK_LEN
    posRef.current = { ...posRef.current, player: progress }
    setPositions(prev => ({ ...prev, player: progress }))
    if (progress >= TRACK_LEN && !doneRef.current) {
      triggerRef.current('player')
    }
  }, [cursorIdx, chars.length])

  // Main race timer
  useEffect(() => {
    if (!running || doneRef.current) return
    const id = setInterval(() => {
      setElapsed(e => {
        const next = e + 1
        setTimeLeft(DUR - next)
        setWpmHist(h => [...h, calcWPM(next)])

        if (next >= DUR && !doneRef.current) {
          // Time up — whoever is furthest wins
          const finalPositions = posRef.current
          const ranking = [
            { id: 'player', pos: finalPositions.player || 0 },
            ...aiBaseRef.current.map(c => ({ id: c.name, pos: finalPositions[c.name] || 0 })),
          ].sort((a, b) => b.pos - a.pos)
          const leader = ranking[0]?.id || 'player'
          triggerRef.current(leader)
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, calcWPM])

  // End when text is finished
  useEffect(() => {
    if (isDone && !doneRef.current) {
      triggerRef.current('player')
    }
  }, [isDone])

  // Input handling
  const handleKey = useCallback((e) => {
    if (e.key === 'Tab') { e.preventDefault(); return }

    if (!revealed && e.key !== 'Escape') {
      setRevealed(true)
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') e.preventDefault()
      return
    }

    if (doneRef.current) return
    if (e.key === 'Backspace') { e.preventDefault(); deleteChar(); return }
    if (e.key.length !== 1) return

    if (!running) setRunning(true)

    const ok = e.key === chars[cursorIdx]
    typeChar(e.key)
    if (ok) audio.keyCorrect()
    else    audio.keyWrong()
    if (e.key === ' ') audio.wordDone()
    e.target.value = ''
  }, [revealed, chars, cursorIdx, deleteChar, typeChar])

  const wpm     = calcWPM(elapsed || 1)
  const progress = Math.min(100, (cursorIdx / (chars.length || 1)) * 100)
  const gameInnerClass = `game-inner${running ? ' game-inner--running' : ''}`

  return (
    <div className={gameInnerClass}>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-block">
          <div className={`stat-num${running ? ' accent' : ' faded'}`}>{running ? wpm : 0}</div>
          <div className="stat-lbl">wpm</div>
        </div>
        <div className="stat-block">
          <div className="stat-num">{stats.accuracy}%</div>
          <div className="stat-lbl">accuracy</div>
        </div>
        <div className="stat-spacer" />
        <div className="timer-block">
          <div className={`timer-num${timeLeft <= 10 ? ' timer-num--urgent' : timeLeft <= DUR / 2 ? ' timer-num--warn' : ''}`}>{timeLeft}</div>
          <div className="timer-track">
            <div className="timer-fill" style={{ width: `${(timeLeft / DUR) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="stats-row">
        <div className="opt-group">
          {['easy', 'medium', 'hard'].map(level => (
            <button
              key={level}
              className={`opt-btn${difficulty === level ? ' on' : ''}`}
              disabled={running}
              onClick={() => { if (!running) setDifficulty(level) }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Race track canvas */}
      <div className="race-track-wrap">
        <canvas ref={canvasRef} />
        {raceOver && (
          <div className="race-overlay">
            {playerPos === 1
              ? <span className="race-result-win">YOU WIN</span>
              : <span className="race-result-lose">
                  {['2nd place', '3rd place', '4th place'][playerPos - 2] || `${playerPos}th place`}
                </span>
            }
          </div>
        )}
      </div>

      {/* Typing box */}
      <div className="typing-box" onClick={() => inputRef.current?.focus()}>
        {!revealed && (
          <div className="idle-overlay">
            start typing to begin
          </div>
        )}
        <TypingText chars={chars} typed={typed} cursorIdx={cursorIdx} />
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
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <p className="type-hint">
        your speed powers the car · targets:
        {' '}
        {aiBaseRef.current.map((c, idx) => (
          <span key={c.name}>
            {idx > 0 && ', '}
            {c.name} ({Math.round(c.wpm * difficultyMult)} wpm)
          </span>
        ))}
      </p>
    </div>
  )
}

function drawTrack(canvas, pos, aiCars, difficultyMult) {
  if (!canvas) return
  const parent = canvas.parentElement
  const W   = (parent?.clientWidth || 600)
  const H   = 200
  const dpr = window.devicePixelRatio || 1

  if (canvas.width !== W * dpr) {
    canvas.width       = W * dpr
    canvas.height      = H * dpr
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`
  }

  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  // Road background
  ctx.fillStyle = '#1e1a2e'
  ctx.roundRect(0, 0, W, H, 12)
  ctx.fill()

  // Road surface
  ctx.fillStyle = '#252032'
  ctx.fillRect(40, 0, W - 80, H)

  // Finish line
  const finX = 40 + (W - 80) * 0.95
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 8])
  ctx.beginPath()
  ctx.moveTo(finX, 0)
  ctx.lineTo(finX, H)
  ctx.stroke()
  ctx.setLineDash([])

  // Lane lines
  const lanes = 4
  const laneH = H / lanes
  for (let i = 1; i < lanes; i++) {
    const y = i * laneH
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.setLineDash([16, 16])
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(W - 40, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  const allCars = [
    { id: 'player', color: PLAYER_COLOR, lane: 0, wpm: null, emoji: '🏎️' },
    ...aiCars.map((c, i) => ({
      id: c.name,
      color: c.color,
      lane: i + 1,
      wpm: c.wpm * difficultyMult,
      emoji: '🏎️',
    })),
  ]

  allCars.forEach(car => {
    const progress = Math.min(1, (pos[car.id] || 0) / TRACK_LEN)
    const x = 40 + (W - 80) * 0.95 * progress
    const y = car.lane * laneH + laneH / 2

    // Under-glow
    const glowGrad = ctx.createRadialGradient(x, y + 4, 2, x, y + 4, 22)
    glowGrad.addColorStop(0, `${car.color}33`)
    glowGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = glowGrad
    ctx.beginPath()
    ctx.arc(x, y + 4, 22, 0, Math.PI * 2)
    ctx.fill()

    // Speed car emoji (mirrored horizontally so it faces the opposite direction)
    ctx.save()
    ctx.translate(x, 0)
    ctx.scale(-1, 1)
    ctx.font = '24px system-ui, emoji'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(car.emoji, 0, y)
    ctx.restore()

    // Labels
    ctx.fillStyle = car.color
    ctx.font = '600 10px Outfit, sans-serif'
    ctx.textBaseline = 'alphabetic'
    const label = car.id === 'player'
      ? 'YOU'
      : `${car.id} · ${Math.round(car.wpm || 0)} wpm`
    ctx.fillText(label, 20, y + 4)
  })
}

function lighten(hex, amount) {
  if (!hex || hex[0] !== '#') return hex
  const num = parseInt(hex.slice(1), 16)
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff
  r = Math.min(255, Math.round(r + (255 - r) * amount))
  g = Math.min(255, Math.round(g + (255 - g) * amount))
  b = Math.min(255, Math.round(b + (255 - b) * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

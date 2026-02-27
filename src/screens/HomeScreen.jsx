import React, { useState } from 'react'

const GAMES = [
  {
    id: 'classic',
    icon: '🎯',
    badge: 'classic',
    name: 'Classic',
    desc: 'Beat the clock. Measure your true WPM against the purest typing test there is.',
    tag: '15s · 30s · 60s · 2m',
    color: '#ff8b6e',
  },
  {
    id: 'zen',
    icon: '🌿',
    badge: 'relaxed',
    name: 'Zen',
    desc: 'No timer, no pressure. Just you, the words, and the quiet hum of your keys.',
    tag: 'untimed · peaceful',
    color: '#5ee6c8',
  },
  {
    id: 'wordrush',
    icon: '⚡',
    badge: 'new',
    name: 'Word Rush',
    desc: 'One word at a time, one ticking ring per word. Type faster as the ring shrinks.',
    tag: 'score-based · 60s',
    color: '#fbbf24',
  },
  {
    id: 'survivor',
    icon: '❤️',
    badge: 'challenge',
    name: 'Survivor',
    desc: 'Three lives. Finish a word with errors and lose one. Stay alive to the end.',
    tag: '3 lives · timed',
    color: '#f87196',
  },
  {
    id: 'ghost',
    icon: '👻',
    badge: 'vs pb',
    name: 'Ghost Race',
    desc: 'Your personal best haunts this track. Race the ghost cursor. Beat your own record.',
    tag: 'race your personal best',
    color: '#a78bfa',
    wide: true,
  },
  {
    id: 'carrace',
    icon: '🏎️',
    badge: 'race',
    name: 'Car Race',
    desc: 'Your typing speed powers a car on a track. Finish ahead of the pack before time runs out.',
    tag: '90s · position-based',
    color: '#ff8b6e',
  },
]

export default function HomeScreen({ onLaunch, soundOn, onToggleSound, history, onClearHistory }) {
  const [showHistory, setShowHistory] = useState(false)
  const latest = history[0]

  return (
    <div className="home-wrap">
      <nav className="home-nav">
        <div className="logo">
          <span className="logo-mark">⌨</span>
          type<strong>forge</strong>
        </div>
        <div className="nav-right">
          <button className="chip-btn" onClick={onToggleSound}>
            <SoundBars on={soundOn} />
            sound
          </button>
          <button className="chip-btn" onClick={() => setShowHistory(h => !h)}>
            history
          </button>
        </div>
      </nav>

      <div className="home-hero">
        <div className="hero-eyebrow">a typing arcade</div>
        <h1 className="hero-title">
          How fast are<br /><em>your fingers?</em>
        </h1>
        <p className="hero-sub">Five games. One mission. Get faster.</p>

        {latest && (
          <div className="hero-recap" onClick={() => setShowHistory(true)}>
            <div className="hero-recap-label">latest run</div>
            <div className="hero-recap-main">
              <span className="hero-recap-wpm">{latest.score}</span>
              <span className="hero-recap-meta">
                wpm · {latest.game} · {latest.mode} · {latest.date}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="game-grid">
        {GAMES.map(g => (
          <button
            key={g.id}
            className="game-card"
            style={{ '--c': g.color }}
            onClick={() => onLaunch(g.id)}
          >
            <div className="card-glow" />
            <div className="card-top">
              <span className="card-icon">{g.icon}</span>
              <span className="card-badge">{g.badge}</span>
            </div>
            <h3 className="card-name">{g.name}</h3>
            <p className="card-desc">{g.desc}</p>
            <div className="card-footer">
              <span className="card-tag">{g.tag}</span>
              <span className="card-arrow">→</span>
            </div>
          </button>
        ))}
      </div>

      {showHistory && (
        <div className="history-panel">
          <div className="panel-header">
            <span className="section-label">recent scores</span>
            <button className="text-btn danger" onClick={onClearHistory}>clear all</button>
          </div>
          {history.length === 0 ? (
            <p className="history-empty">no scores yet — play a game first!</p>
          ) : (
            <div className="history-scroll">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>#</th><th>Score</th><th>Accuracy</th>
                    <th>Game</th><th>Mode</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((e, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--muted-2)' }}>{i + 1}</td>
                      <td><span className={`wpm-pill ${wpmClass(e.score)}`}>{e.score}</span></td>
                      <td>{e.acc}</td>
                      <td>{e.game}</td>
                      <td style={{ color: 'var(--muted)' }}>{e.mode}</td>
                      <td style={{ color: 'var(--muted-2)' }}>{e.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SoundBars({ on }) {
  return (
    <span className={`sound-bars${on ? '' : ' muted'}`}>
      <span /><span /><span /><span />
    </span>
  )
}

function wpmClass(n) {
  if (n >= 100) return 'wpm-god'
  if (n >= 70)  return 'wpm-great'
  if (n >= 40)  return 'wpm-good'
  return 'wpm-ok'
}


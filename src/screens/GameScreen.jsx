import React, { useState, useEffect, useCallback } from 'react'
import ClassicGame  from '../games/ClassicGame'
import ZenGame      from '../games/ZenGame'
import WordRushGame from '../games/WordRushGame'
import SurvivorGame from '../games/SurvivorGame'
import GhostGame    from '../games/GhostGame'
import CarRaceGame  from '../games/CarRaceGame'

const GAME_NAMES = {
  classic:  'Classic',
  zen:      'Zen',
  wordrush: 'Word Rush',
  survivor: 'Survivor',
  ghost:    'Ghost Race',
  carrace:  'Car Race',
}

export default function GameScreen({ gameId, options, onFinish, onBack, onOptionsChange, onOpenCustom }) {
  const [restartKey, setRestartKey] = useState(0)

  // When options change, increment key to remount the game
  const handleOptions = useCallback((patch) => {
    onOptionsChange(patch)
    setRestartKey(k => k + 1)
  }, [onOptionsChange])

  // Escape key → back
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onBack()
      if (e.key === 'Tab') { e.preventDefault(); setRestartKey(k => k + 1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  const GameComponent = {
    classic:  ClassicGame,
    zen:      ZenGame,
    wordrush: WordRushGame,
    survivor: SurvivorGame,
    ghost:    GhostGame,
    carrace:  CarRaceGame,
  }[gameId]

  return (
    <div className="game-wrap">
      {/* Nav */}
      <div className="game-nav">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          back
        </button>
        <span className="game-nav-title">{GAME_NAMES[gameId]}</span>

        {/* Options */}
        <div className="game-options">
          <GameOptions
            gameId={gameId}
            options={options}
            onOptionsChange={handleOptions}
            onOpenCustom={onOpenCustom}
            onRestart={() => setRestartKey(k => k + 1)}
          />
        </div>
      </div>

      {/* Game */}
      {GameComponent && (
        <GameComponent
          key={`${gameId}-${restartKey}`}
          options={options}
          onFinish={onFinish}
        />
      )}
    </div>
  )
}

function GameOptions({ gameId, options, onOptionsChange, onOpenCustom, onRestart }) {
  const hasDuration = ['classic', 'survivor', 'ghost'].includes(gameId)
  const hasModes    = ['classic', 'zen', 'ghost'].includes(gameId)
  const hasMods     = ['classic', 'zen', 'survivor'].includes(gameId)
  const isRush      = gameId === 'wordrush'

  if (isRush) return (
    <span className="rush-badge-label">60s · auto-speed</span>
  )

  return (
    <>
      {hasDuration && (
        <div className="opt-group">
          {[15, 30, 60, 120].map(d => (
            <button
              key={d}
              className={`opt-btn${options.dur === d ? ' on' : ''}`}
              onClick={() => onOptionsChange({ dur: d })}
            >
              {d === 120 ? '2m' : d + 's'}
            </button>
          ))}
        </div>
      )}

      {hasDuration && hasModes && <div className="opt-sep" />}

      {hasModes && (
        <div className="opt-group">
          {['words', 'quotes', 'code'].map(m => (
            <button
              key={m}
              className={`opt-btn${options.mode === m ? ' on' : ''}`}
              onClick={() => onOptionsChange({ mode: m })}
            >
              {m}
            </button>
          ))}
          <button className="opt-btn" onClick={onOpenCustom}>custom</button>
        </div>
      )}

      {hasMods && <div className="opt-sep" />}

      {hasMods && (
        <div className="opt-group">
          <button
            className={`opt-btn${options.punct ? ' on' : ''}`}
            onClick={() => onOptionsChange({ punct: !options.punct })}
          >
            @#!
          </button>
          <button
            className={`opt-btn${options.nums ? ' on' : ''}`}
            onClick={() => onOptionsChange({ nums: !options.nums })}
          >
            123
          </button>
        </div>
      )}
    </>
  )
}


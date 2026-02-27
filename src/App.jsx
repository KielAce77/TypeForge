import React, { useState, useCallback, useRef, useEffect } from 'react'
import { audio } from './lib/audio'
import HomeScreen    from './screens/HomeScreen'
import GameScreen    from './screens/GameScreen'
import ResultsScreen from './screens/ResultsScreen'

const DEFAULT_OPTIONS = {
  dur:    30,
  mode:   'words',
  punct:  false,
  nums:   false,
  custom: '',
}

function loadInitialNav() {
  if (typeof window === 'undefined') {
    return { screen: 'home', gameId: null, options: DEFAULT_OPTIONS }
  }
  try {
    const raw = window.sessionStorage.getItem('tf_session')
    if (!raw) return { screen: 'home', gameId: null, options: DEFAULT_OPTIONS }
    const parsed = JSON.parse(raw)
    let screen = parsed.screen || 'home'
    const gameId = parsed.gameId || null
    const options = { ...DEFAULT_OPTIONS, ...(parsed.options || {}) }

    // Never restore results screen; drop back into game or home.
    if (screen === 'results') {
      screen = gameId ? 'game' : 'home'
    }
    if (screen !== 'home' && screen !== 'game') {
      screen = 'home'
    }

    return { screen, gameId, options }
  } catch {
    return { screen: 'home', gameId: null, options: DEFAULT_OPTIONS }
  }
}

export default function App() {
  const initialNav = loadInitialNav()

  const [screen,   setScreen]   = useState(initialNav.screen)  // 'home' | 'game' | 'results'
  const [gameId,   setGameId]   = useState(initialNav.gameId)
  const [options,  setOptions]  = useState(initialNav.options)
  const [result,   setResult]   = useState(null)
  const [soundOn,  setSoundOn]  = useState(() => audio.isEnabled())
  const [history,  setHistory]  = useState(() => JSON.parse(localStorage.getItem('tf_history') || '[]'))
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [toast,    setToast]    = useState(null)
  const toastTimer = useRef(null)

  // ── Navigation ──

  const launch = useCallback((id) => {
    setGameId(id)
    setScreen('game')
  }, [])

  const goHome = useCallback(() => {
    setScreen('home')
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('tf_session')
    }
  }, [])

  const handleFinish = useCallback((res) => {
    setResult(res)
    setScreen('results')

    // Save to history
    const entry = {
      score: res.score,
      acc:   res.stats.find(s => s.lbl === 'Accuracy')?.val || '—',
      game:  res.label.split(' ')[0],
      mode:  options.mode,
      date:  new Date().toLocaleDateString(),
    }
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 30)
      localStorage.setItem('tf_history', JSON.stringify(next))
      return next
    })
  }, [options.mode])

  const handlePlayAgain = useCallback(() => {
    setResult(null)
    setScreen('game')
    setGameId(g => g)  // keep same gameId
  }, [])

  const handleOptionsChange = useCallback((patch) => {
    setOptions(prev => ({ ...prev, ...patch }))
  }, [])

  // ── Sound ──

  const toggleSound = useCallback(() => {
    const next = !audio.isEnabled()
    audio.setEnabled(next)
    setSoundOn(next)
    showToast(next ? 'sound on' : 'sound off')
  }, [])

  // ── History ──

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('tf_history')
    showToast('history cleared')
  }, [])

  // ── Copy result ──

  const copyResult = useCallback(() => {
    if (!result) return
    const acc = result.stats.find(s => s.lbl === 'Accuracy')?.val || '—'
    const txt = `TypeForge — ${result.label}: ${result.mainNum} ${result.mainUnit} · ${acc} accuracy`
    navigator.clipboard?.writeText(txt).then(() => showToast('copied!'))
  }, [result])

  // ── Custom text modal ──

  const openCustom = useCallback(() => setCustomModalOpen(true),  [])
  const closeCustom= useCallback(() => setCustomModalOpen(false), [])

  const applyCustom = useCallback((text) => {
    handleOptionsChange({ mode: 'custom', custom: text })
    closeCustom()
  }, [handleOptionsChange, closeCustom])

  // ── Toast ──

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  // ── Session persistence ──

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      // Only persist when in an active game context with a valid gameId.
      if (screen === 'game' && gameId) {
        const payload = { screen, gameId, options }
        window.sessionStorage.setItem('tf_session', JSON.stringify(payload))
      } else {
        window.sessionStorage.removeItem('tf_session')
      }
    } catch {
      // ignore sessionStorage errors
    }
  }, [screen, gameId, options])

  // ── Render ──

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          onLaunch={launch}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          history={history}
          onClearHistory={clearHistory}
        />
      )}

      {screen === 'game' && gameId && (
        <GameScreen
          key={`game-${gameId}`}
          gameId={gameId}
          options={options}
          onFinish={handleFinish}
          onBack={goHome}
          onOptionsChange={handleOptionsChange}
          onOpenCustom={openCustom}
        />
      )}

      {screen === 'results' && result && (
        <ResultsScreen
          result={result}
          onPlayAgain={handlePlayAgain}
          onHome={goHome}
          onCopy={copyResult}
        />
      )}

      {/* Custom text modal */}
      {customModalOpen && (
        <CustomModal onApply={applyCustom} onClose={closeCustom} />
      )}

      {/* Toast */}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}

function CustomModal({ onApply, onClose }) {
  const [text, setText] = useState('')

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">custom text</div>
        <p className="modal-sub">paste or type anything to practice with</p>
        <textarea
          className="modal-textarea"
          placeholder="paste your text here…"
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose}>cancel</button>
          <button
            className="btn-primary"
            onClick={() => { if (text.trim()) onApply(text.trim()) }}
          >
            start test
          </button>
        </div>
      </div>
    </div>
  )
}

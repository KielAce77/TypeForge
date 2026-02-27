import React, { useEffect, useRef, useState } from 'react'

export default function ResultsScreen({ result, onPlayAgain, onHome, onCopy }) {
  const canvasRef = useRef(null)
  const [isPB, setIsPB] = useState(false)

  // Check + save personal best
  useEffect(() => {
    if (!result?.pbKey) return
    const prev = parseInt(localStorage.getItem(result.pbKey) || '0')
    if (result.score > prev) {
      localStorage.setItem(result.pbKey, String(result.score))
      setIsPB(true)
    }
  }, [result])

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result?.wpmHist?.length) return
    drawChart(canvas, result.wpmHist)
  }, [result])

  if (!result) return null

  return (
    <div className="results-wrap">
      <div className="result-hero">
        <div className="result-game-label">{result.label}</div>
        <div className="result-main-num">{result.mainNum}</div>
        <div className="result-main-unit">{result.mainUnit}</div>
        {isPB && <div className="result-pb">new personal best</div>}
      </div>

      <div className="result-stats-row">
        {result.stats.map((s, i) => (
          <div key={i} className="result-stat">
            <div className="result-stat-val">{s.val}</div>
            <div className="result-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {result.wpmHist?.length > 1 && (
        <div className="result-chart-wrap">
          <div className="section-label">performance over time</div>
          <canvas ref={canvasRef} style={{ width: '100%', height: 100, display: 'block' }} />
        </div>
      )}

      <div className="result-actions">
        <button className="btn-primary" onClick={onPlayAgain}>play again</button>
        <button className="result-link" onClick={onHome}>back to menu</button>
        <button className="result-link" onClick={onCopy}>copy result</button>
      </div>
    </div>
  )
}

function drawChart(canvas, data) {
  const dpr = window.devicePixelRatio || 1
  const W   = canvas.offsetWidth
  const H   = 100
  canvas.width  = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  if (data.length < 2) return

  const max = Math.max(...data, 1)
  const p   = { t: 6, b: 4, l: 4, r: 4 }
  const cw  = W - p.l - p.r
  const ch  = H - p.t - p.b

  const pts = data.map((v, i) => ({
    x: p.l + (i / (data.length - 1)) * cw,
    y: p.t + ch * (1 - v / max),
  }))

  // Grid
  ;[0, 0.5, 1].forEach(f => {
    const y = p.t + ch * (1 - f)
    ctx.strokeStyle = '#2e2840'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(p.l + cw, y); ctx.stroke()
    ctx.fillStyle = '#4a4a5e'
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.fillText(Math.round(max * f), 2, y + 3)
  })

  // Area fill
  const grad = ctx.createLinearGradient(0, p.t, 0, p.t + ch)
  grad.addColorStop(0, 'rgba(255,139,110,0.25)')
  grad.addColorStop(1, 'rgba(255,139,110,0)')
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i-1].x + pts[i].x) / 2
    ctx.bezierCurveTo(mx, pts[i-1].y, mx, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.lineTo(pts[pts.length-1].x, p.t + ch)
  ctx.lineTo(pts[0].x, p.t + ch)
  ctx.fillStyle = grad
  ctx.fill()

  // Line
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i-1].x + pts[i].x) / 2
    ctx.bezierCurveTo(mx, pts[i-1].y, mx, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.strokeStyle = '#ff8b6e'
  ctx.lineWidth = 2
  ctx.stroke()
}


// Web Audio API sound engine

let ctx = null
let _enabled = true

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, type, gain, attack, decay, delay = 0) {
  if (!_enabled) return
  try {
    const c   = getCtx()
    const osc = c.createOscillator()
    const g   = c.createGain()
    osc.connect(g)
    g.connect(c.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = c.currentTime + delay
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
    osc.start(t)
    osc.stop(t + attack + decay + 0.01)
  } catch { /* silent */ }
}

export const audio = {
  keyCorrect()   { tone(1100, 'sine',     0.04, 0.001, 0.06) },
  keyWrong()     { tone(180,  'sawtooth', 0.04, 0.001, 0.09) },
  wordDone()     { tone(880,  'sine',     0.04, 0.001, 0.07) },
  rushCorrect()  { tone(880, 'sine', 0.06, 0.005, 0.10); tone(1320, 'sine', 0.04, 0.005, 0.08, 0.05) },
  rushFail()     { tone(220, 'square', 0.04, 0.001, 0.12); tone(160, 'square', 0.03, 0.001, 0.15, 0.06) },
  lifeLost()     { [400,280,200].forEach((f,i) => tone(f, 'sawtooth', 0.06, 0.001, 0.15, i*0.1)) },
  gameOver()     { [400,320,240,180].forEach((f,i) => tone(f, 'sawtooth', 0.06, 0.001, 0.18, i*0.12)) },
  finish()       { [523,659,784,1047,1319].forEach((f,i) => tone(f, 'sine', 0.07, 0.005, 0.25, i*0.1)) },
  personalBest() { [523,659,784,1047,784,1047,1319].forEach((f,i) => tone(f, 'sine', 0.07, 0.005, 0.2, i*0.08)) },
  ghostBeaten()  { tone(660,'sine',0.06,0.005,0.15); tone(880,'sine',0.05,0.005,0.12,0.1); tone(1100,'sine',0.04,0.005,0.2,0.18) },

  setEnabled(val) { _enabled = val },
  isEnabled()     { return _enabled },
}


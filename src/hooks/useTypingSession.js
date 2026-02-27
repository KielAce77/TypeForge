import { useState, useCallback, useMemo } from 'react'

/**
 * Core typing session hook — shared by Classic, Zen, Survivor, Ghost.
 * Tracks chars, typed input, cursor position, and stats.
 */
export function useTypingSession(chars) {
  const [typed, setTyped] = useState([])

  const cursorIdx  = typed.length
  const isDone     = cursorIdx >= chars.length

  const stats = useMemo(() => {
    let correct = 0
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === chars[i]) correct++
    }
    const incorrect = typed.length - correct
    const accuracy  = typed.length === 0 ? 100 : Math.round((correct / typed.length) * 100)
    return { correct, incorrect, accuracy }
  }, [typed, chars])

  const typeChar = useCallback((char) => {
    setTyped(prev => [...prev, char])
  }, [])

  const deleteChar = useCallback(() => {
    setTyped(prev => (prev.length > 0 ? prev.slice(0, -1) : prev))
  }, [])

  /** WPM given elapsed seconds */
  const calcWPM = useCallback((elapsedSec) => {
    return Math.max(0, Math.round((stats.correct / 5) / Math.max(elapsedSec, 1) * 60))
  }, [stats.correct])

  /** True if the word just completed (space just pressed) had any errors */
  const lastWordHasError = useCallback(() => {
    const spacePos = cursorIdx
    if (spacePos < 0 || chars[spacePos] !== ' ') return false
    let start = spacePos - 1
    while (start > 0 && chars[start - 1] !== ' ') start--
    for (let i = start; i < spacePos; i++) {
      if (typed[i] !== chars[i]) return true
    }
    return false
  }, [typed, chars, cursorIdx])

  return { typed, cursorIdx, isDone, stats, typeChar, deleteChar, calcWPM, lastWordHasError }
}


import React, { useLayoutEffect, useRef, useState, memo } from 'react'

/**
 * Typing text renderer with auto-scroll.
 * Keeps the cursor on the middle (second) visible row so upcoming words always slide into view.
 */
const TypingText = memo(function TypingText({ chars, typed, cursorIdx, ghostIdx }) {
  const innerRef  = useRef(null)
  const scrollRef = useRef(0)
  const [scrollY, setScrollY] = useState(0)

  useLayoutEffect(() => {
    if (!innerRef.current || chars.length === 0) return

    const safeIdx = Math.max(0, Math.min(cursorIdx, chars.length - 1))
    const curEl   = document.getElementById(`tc-${safeIdx}`)
    const container = innerRef.current.parentElement
    if (!curEl || !container) return

    const lineH = container.clientHeight / 3
    const row   = Math.floor(curEl.offsetTop / lineH)
    const target = row > 1 ? (row - 1) * lineH : 0

    if (Math.abs(target - scrollRef.current) > 0.5) {
      scrollRef.current = target
      setScrollY(target)
    }
  }, [cursorIdx, chars.length])

  return (
    <div className="words-display">
      <div
        ref={innerRef}
        className="words-inner"
        style={{ transform: scrollY > 0 ? `translateY(-${scrollY}px)` : undefined }}
      >
        {chars.map((c, i) => {
          let cls = 'tc'
          if (i < cursorIdx) {
            cls = typed[i] === c ? 'tc ok' : 'tc err'
          } else if (i === cursorIdx) {
            cls = 'tc cur'
          }
          if (ghostIdx !== undefined && Math.floor(ghostIdx) === i && i !== cursorIdx) {
            cls += ' ghost-cur'
          }
          return (
            <span key={i} id={`tc-${i}`} className={cls}>
              {c}
            </span>
          )
        })}
      </div>
    </div>
  )
})

export default TypingText


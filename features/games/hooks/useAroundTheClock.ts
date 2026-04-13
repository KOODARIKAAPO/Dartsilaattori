import { useState } from "react";

type Segment = "single" | "double" | "triple" | "miss" | "bull" | "outerBull"

interface GameSettings {
  finishType: "singleBull" | "bullseye"
}

interface GameState {
  currentNumber: number
  dartsThrown: number
  hits: number
  finished: boolean
  lastHit: string | null
}

export const useAroundTheClock = (settings: GameSettings) => {
  const [currentNumber, setCurrentNumber] = useState(1)
  const [dartsThrown, setDartsThrown] = useState(0)
  const [hits, setHits] = useState(0)
  const [finished, setFinished] = useState(false)
  const [lastHit, setLastHit] = useState<string | null>(null)
  const [history, setHistory] = useState<GameState[]>([])

  const isBullStage = currentNumber === 21

  const saveState = () => {
    setHistory(prev => [...prev, {
      currentNumber,
      dartsThrown,
      hits,
      finished,
      lastHit,
    }])
  }

  const handleThrow = (segment: Segment) => {
    if (finished) return

    saveState()

    setDartsThrown((d) => d + 1)

    if (segment === "miss") {
      setLastHit("MISS")
      return
    }

    let isHit = false

    if (!isBullStage) {
      isHit = true
    } else {
      if (
        (settings.finishType === "singleBull" && segment === "outerBull") ||
        (settings.finishType === "bullseye" && segment === "bull")
      ) {
        isHit = true
      }
    }

    if (!isHit) return

    setHits((h) => h + 1)

    if (!isBullStage) {
      const next = currentNumber + 1
      setCurrentNumber(next > 20 ? 21 : next)
    } else {
      setFinished(true)
    }

    setLastHit(segment.toUpperCase())
  }

  const undo = () => {
    if (history.length === 0) return

    const previousState = history[history.length - 1]
    setCurrentNumber(previousState.currentNumber)
    setDartsThrown(previousState.dartsThrown)
    setHits(previousState.hits)
    setFinished(previousState.finished)
    setLastHit(previousState.lastHit)
    setHistory(prev => prev.slice(0, -1))
  }

  const resetGame = () => {
    setCurrentNumber(1)
    setDartsThrown(0)
    setHits(0)
    setFinished(false)
    setLastHit(null)
    setHistory([])
  }

  const hitRate = dartsThrown > 0 ? (hits / dartsThrown) * 100 : 0

  return {
    currentNumber,
    dartsThrown,
    hits,
    hitRate,
    finished,
    lastHit,
    handleThrow,
    undo,
    resetGame,
  };
};
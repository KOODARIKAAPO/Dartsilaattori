//Hookki pelaajan vuoron käsittelyä varten(pisteet, tikkamäärä)
import { useCallback, useMemo, useState } from "react";
import type { Player } from "../../../types/X01Types";

type Params = {
  isFinished: boolean;
  isMatchFinished: boolean;
  currentPlayer: Player | null;
  submitPlayerTurn: (points: number) => void;
  undo: () => void;
  onCheckoutDarts?: (value: number) => void;
};

export function useX01TurnInput({
  isFinished,
  isMatchFinished,
  currentPlayer,
  submitPlayerTurn,
  undo,
  onCheckoutDarts,
}: Params) {
  const [pendingDarts, setPendingDarts] = useState<number[]>([]);

  const pendingTotal = useMemo(
    () => pendingDarts.reduce((sum, dart) => sum + dart, 0),
    [pendingDarts]
  );
  const showPending = pendingDarts.length > 0 && !isFinished && !isMatchFinished;

  const previewScore = useCallback(
    (currentScore: number) => {
      if (!showPending) return currentScore;
      const remaining = currentScore - pendingTotal;
      return remaining >= 0 ? remaining : currentScore;
    },
    [pendingTotal, showPending]
  );

  const handleThrow = (value: number, multiplier: 1 | 2 | 3) => {
    if (isFinished || isMatchFinished) return;
    const points = value * multiplier;

    setPendingDarts((prev) => {
      if (prev.length >= 3) return prev;
      const next = [...prev, points];
      const total = next.reduce((sum, dart) => sum + dart, 0);
      const currentScore = currentPlayer?.currentScore ?? 0;
      const remaining = currentScore - total;

      if (remaining <= 0) {
        if (remaining === 0) {
          onCheckoutDarts?.(next.length);
        }
        submitPlayerTurn(total);
        return [];
      }

      if (next.length === 3) {
        submitPlayerTurn(total);
        return [];
      }

      return next;
    });
  };

  const handleUndo = () => {
    if (isMatchFinished) return;
    setPendingDarts((prev) => {
      if (prev.length > 0) {
        return prev.slice(0, -1);
      }
      undo();
      return prev;
    });
  };

  const resetPendingDarts = () => {
    setPendingDarts([]);
  };

  return {
    pendingDarts,
    previewScore,
    handleThrow,
    handleUndo,
    resetPendingDarts,
  };
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Surface, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useX01Game } from "../hooks/useX01Game";
import { useX01Stats } from "../hooks/useX01Stats";
import { useX01MatchAverages } from "../hooks/useX01MatchAverages";
import { useX01MatchState } from "../hooks/useX01MatchState";
import { useX01TurnInput } from "../hooks/useX01TurnInput";
import DartsKeyboard from "./Dartskeyboard";
import X01BustPrompt from "./X01BustPrompt";
import X01DoubleAttemptPrompt from "./X01DoubleAttemptPrompt";
import X01HeaderCard from "./X01HeaderCard";
import X01ScoreCards from "./X01ScoreCards";
import type { X01Variant } from "../../../types/X01Types";
import { auth } from "../../../firebase/Auth";
import { addGameForUser } from "../../../firebase/Firestore";

//Pää pelikomponentti. X01 ohjauskeskus. Pelkkä UI ja tilahallinta

type PlayerInput = {
  id: string;
  name: string;
};

interface GameScreenProps {
  startingScore: X01Variant;
  players: PlayerInput[];
  bestOf?: 1 | 3 | 5 | 7;
}

export function GameScreen({startingScore, players, bestOf = 1 }: GameScreenProps) 
{
  const theme = useTheme();
  const styles = createStyles(theme);
  const outlinedTextColor = theme.colors.onSurface;
  const navigation = useNavigation<any>();

  // Tuodaan pelin tile ja logiikka useX01Game hookista
  const {
    state,
    players: gamePlayers,
    currentPlayer,
    round,
    winnerId,
    isFinished,
    checkout,
    submitPlayerTurn,
    setDoubleAttempts,
    undo,
    startNextLeg,
    resetMatch,
    reset,
  } = useX01Game({
    startingScore,
    players,
  });

  const { getPlayerAverage, getPlayerTotals, resetMatchAverages } =
    useX01MatchAverages({
      turns: state.turns,
      isFinished,
    });

  const mainPlayerId = players[0]?.id ?? null;
  const [matchDoubleAttempts, setMatchDoubleAttempts] = useState<
    Record<string, number>
  >(() =>
    players.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<string, number>
    )
  );
  const lastAggregatedLegKey = useRef<string | null>(null);
  const [matchTotals, setMatchTotals] = useState({
    points: 0,
    dartsThrown: 0,
    highestCheckout: 0,
  });
  const lastAggregatedTotalsKey = useRef<string | null>(null);
  const [matchSaving, setMatchSaving] = useState(false);
  const [matchSaved, setMatchSaved] = useState(false);

  const {
    matchWins,
    matchWinnerId,
    isMatchFinished,
    currentLeg,
    pendingMatchWin,
    handleNextLeg: advanceLeg,
    handleResetMatch: resetMatchState,
  } = useX01MatchState({
    players,
    bestOf,
    isFinished,
    winnerId,
    startNextLeg,
    resetMatch,
  });

  const {
    showStatsPrompt,
    dartsToCheckout,
    setDartsToCheckout,
    statsSummary,
    showBustPrompt,
    handleBustDartsUsed,
    showDoublePrompt,
    pendingDoubleTurn,
    handleDoubleDartsUsed,
    handleSaveStats,
    statsSaving,
    statsSaved,
    statsError,
    resetStatsTracking,
  } = useX01Stats({
    state,
    isFinished,
    isMatchFinished,
    winnerId,
    mainPlayerId,
    setDoubleAttempts,
  });

  const {
    pendingDarts,
    previewScore,
    handleThrow,
    handleUndo,
    resetPendingDarts,
  } =
    useX01TurnInput({
      isFinished,
      isMatchFinished,
      currentPlayer,
      submitPlayerTurn,
      undo,
      onCheckoutDarts: (value) => {
        if (dartsToCheckout == null) {
          setDartsToCheckout(value);
        }
      },
    });

  const legAttempts = useMemo(() => {
    if (!isFinished || state.turns.length === 0) {
      return { key: null as string | null, attempts: {} as Record<string, number> };
    }

    const winningTurnKey = `${state.turns[state.turns.length - 1].timestamp}`;
    const attempts: Record<string, number> = {};

    for (const turn of state.turns) {
      const value = turn.doubleAttempts;
      if (value == null) continue;
      attempts[turn.playerId] = (attempts[turn.playerId] ?? 0) + value;
    }

    return { key: winningTurnKey, attempts };
  }, [isFinished, state.turns]);

  const aggregateLegAttempts = useCallback(() => {
    if (!legAttempts.key) return;
    if (lastAggregatedLegKey.current === legAttempts.key) return;

    setMatchDoubleAttempts((prev) => {
      const next = { ...prev };
      for (const [playerId, value] of Object.entries(legAttempts.attempts)) {
        next[playerId] = (next[playerId] ?? 0) + value;
      }
      return next;
    });

    lastAggregatedLegKey.current = legAttempts.key;
  }, [legAttempts]);

  useEffect(() => {
    if (!isFinished || !statsSummary) return;
    const legKey =
      state.turns.length > 0
        ? `${state.turns[state.turns.length - 1].timestamp}`
        : null;
    if (!legKey) return;
    if (lastAggregatedTotalsKey.current === legKey) return;

    const mainWonLeg = winnerId === mainPlayerId;
    if (mainWonLeg && isMatchFinished && !statsSaved) return;

    setMatchTotals((prev) => ({
      points: prev.points + statsSummary.totalPoints,
      dartsThrown: prev.dartsThrown + statsSummary.totalDartsThrown,
      highestCheckout: Math.max(prev.highestCheckout, statsSummary.checkout ?? 0),
    }));
    lastAggregatedTotalsKey.current = legKey;
  }, [
    isFinished,
    isMatchFinished,
    mainPlayerId,
    statsSaved,
    statsSummary,
    state.turns,
    winnerId,
  ]);

  useEffect(() => {
    if (!isMatchFinished) return;
    if (matchSaved || matchSaving) return;
    if (!mainPlayerId) return;
    if (pendingDoubleTurn) return;

    const effectiveAttempts: Record<string, number> = { ...matchDoubleAttempts };
    if (
      legAttempts.key &&
      lastAggregatedLegKey.current !== legAttempts.key
    ) {
      for (const [playerId, value] of Object.entries(legAttempts.attempts)) {
        effectiveAttempts[playerId] =
          (effectiveAttempts[playerId] ?? 0) + value;
      }
    }

    const legKey =
      state.turns.length > 0
        ? `${state.turns[state.turns.length - 1].timestamp}`
        : null;
    if (legKey && lastAggregatedTotalsKey.current !== legKey) return;

    if (matchWinnerId === mainPlayerId && !statsSaved) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const saveMatch = async () => {
      try {
        setMatchSaving(true);
        await addGameForUser(uid, {
          points: matchTotals.points,
          dartsThrown: matchTotals.dartsThrown,
          doublesAttempted: effectiveAttempts[mainPlayerId] ?? 0,
          doublesHit: matchWins[mainPlayerId] ?? 0,
          checkout: matchTotals.highestCheckout || null,
        });
        setMatchSaved(true);
      } finally {
        setMatchSaving(false);
      }
    };

    void saveMatch();
  }, [
    isMatchFinished,
    mainPlayerId,
    matchDoubleAttempts,
    matchSaved,
    matchSaving,
    matchTotals,
    matchWins,
    matchWinnerId,
    pendingDoubleTurn,
    state.turns,
    statsSaved,
    legAttempts,
  ]);

  const playerStats = useMemo(() => {
    if (!isFinished && !isMatchFinished) return [];

    const effectiveAttempts: Record<string, number> = { ...matchDoubleAttempts };
    if (
      legAttempts.key &&
      lastAggregatedLegKey.current !== legAttempts.key
    ) {
      for (const [playerId, value] of Object.entries(legAttempts.attempts)) {
        effectiveAttempts[playerId] =
          (effectiveAttempts[playerId] ?? 0) + value;
      }
    }

    return gamePlayers.map((player) => {
      const { points, darts } = getPlayerTotals(player.id);
      const average = darts > 0 ? (points / darts) * 3 : null;

      const doublesAttempted = effectiveAttempts[player.id] ?? 0;
      const doublesHit = matchWins[player.id] ?? 0;

      return {
        id: player.id,
        name: player.name,
        average,
        dartsThrown: darts,
        doublesAttempted,
        doublesHit,
      };
    });
  }, [
    gamePlayers,
    getPlayerTotals,
    isFinished,
    isMatchFinished,
    legAttempts,
    matchDoubleAttempts,
    matchWins,
  ]);

  const handleResetLeg = () => {
    // Nollaa legi ja keskeneräiset heitot
    if (isMatchFinished) return;
    resetPendingDarts();
    resetStatsTracking();
    reset();
  };

  const handleNextLeg = () => {
    if (!winnerId) return;
    if (pendingDoubleTurn || showBustPrompt) return;
    aggregateLegAttempts();
    const matchEnded = advanceLeg();
    if (matchEnded) return;
    resetPendingDarts();
    resetStatsTracking();
  };

  const handleResetMatch = () => {
    // Nollaa koko ottelu (voitot + legi)
    // TODO: Varmista, ettei keskeneräinen ottelu ylikirjoita tallennettuja tilastoja
    resetMatchAverages();
    resetStatsTracking();
    resetPendingDarts();
    setMatchDoubleAttempts(
      players.reduce(
        (acc, player) => ({ ...acc, [player.id]: 0 }),
        {} as Record<string, number>
      )
    );
    lastAggregatedLegKey.current = null;
    setMatchTotals({
      points: 0,
      dartsThrown: 0,
      highestCheckout: 0,
    });
    lastAggregatedTotalsKey.current = null;
    setMatchSaving(false);
    setMatchSaved(false);
    resetMatchState();
  };

  const handleGoHome = () => {
    navigation.navigate("Home");
  };

  const winner = gamePlayers.find((player) => player.id === winnerId) ?? null;
  const matchWinner =
    gamePlayers.find((player) => player.id === matchWinnerId) ?? null;

  return (
    <Surface style={styles.root} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        <X01HeaderCard
          showCurrentPlayer={Boolean(currentPlayer && !isFinished && !isMatchFinished)}
          currentPlayerName={currentPlayer?.name}
          currentPlayerScore={currentPlayer?.currentScore}
          previewScore={previewScore}
          checkout={checkout}
          round={round}
          currentLeg={currentLeg}
          bestOf={bestOf}
          isFinished={isFinished}
          isMatchFinished={isMatchFinished}
          winnerName={winner?.name}
          matchWinnerName={matchWinner?.name}
          pendingMatchWin={pendingMatchWin}
          outlinedTextColor={outlinedTextColor}
          onNextLeg={handleNextLeg}
          onResetMatch={handleResetMatch}
          onGoHome={handleGoHome}
          statsPrompt={{
            visible: showStatsPrompt && isMatchFinished && Boolean(winnerId),
            dartsToCheckout,
            onSelectDartsToCheckout: setDartsToCheckout,
            onSave: handleSaveStats,
            saving: statsSaving,
            saved: statsSaved,
            error: statsError,
          }}
          statsSummary={{
            visible: isMatchFinished && playerStats.length > 0,
            players: playerStats,
          }}
        />

        <X01ScoreCards
          players={gamePlayers}
          currentPlayerId={currentPlayer?.id ?? null}
          matchWins={matchWins}
          previewScore={previewScore}
          getPlayerAverage={getPlayerAverage}
          isFinished={isFinished}
          isMatchFinished={isMatchFinished}
        />

        {/* Syöttö: heittojen kirjaus DartsKeyboardilla */}
        <Surface style={styles.inputCard} elevation={1}>
          <X01BustPrompt
            visible={showBustPrompt}
            onSelect={handleBustDartsUsed}
          />
          <X01DoubleAttemptPrompt
            visible={showDoublePrompt}
            playerName={pendingDoubleTurn?.playerName}
            onSelect={handleDoubleDartsUsed}
          />
          <DartsKeyboard
            onThrow={handleThrow}
            onUndo={handleUndo}
            onReset={handleResetLeg}
            inputPreview={pendingDarts}
            disabled={showDoublePrompt || showBustPrompt}
          />
        </Surface>

      </ScrollView>
    </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 24,
      gap: 16,
    },
    inputCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
  });

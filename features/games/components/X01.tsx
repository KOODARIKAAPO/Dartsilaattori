import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Surface, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useX01Game } from "../hooks/useX01Game";
import { useX01Stats } from "../hooks/useX01Stats";
import { useX01MatchAverages } from "../hooks/useX01MatchAverages";
import { useX01MatchState } from "../hooks/useX01MatchState";
import { useX01TurnInput } from "../hooks/useX01TurnInput";
import { useX01MatchAggregates } from "../hooks/useX01MatchAggregates";
import { useX01MatchPersistence } from "../hooks/useX01MatchPersistence";
import DartsKeyboard from "./Dartskeyboard";
import X01BustPrompt from "./X01BustPrompt";
import X01DoubleAttemptPrompt from "./X01DoubleAttemptPrompt";
import X01HeaderCard from "./X01HeaderCard";
import X01ScoreCards from "./X01ScoreCards";
import type { X01Variant } from "../../../types/X01Types";

//Pää pelikomponentti. X01 ohjauskeskus. Pelkkä UI ja tilahallinta

type PlayerInput = {
  id: string;
  name: string;
};

interface GameScreenProps {
  startingScore: X01Variant;
  players: PlayerInput[];
  mainPlayerId?: string | null;
  bestOf?: 1 | 3 | 5 | 7;
  useSets?: boolean;
  bestOfSets?: 1 | 3 | 5;
  bestOfLegs?: 1 | 3 | 5 | 7;
  startingPlayerIndex?: number;
}

export function GameScreen({
  startingScore,
  players,
  mainPlayerId: providedMainPlayerId,
  bestOf = 1,
  useSets = false,
  bestOfSets = 3,
  bestOfLegs = 5,
  startingPlayerIndex = 0,
}: GameScreenProps)
{
  // --- UI/theme/nav ---
  const theme = useTheme();
  const styles = createStyles(theme);
  const outlinedTextColor = theme.colors.onSurface;
  const navigation = useNavigation<any>();

  // --- Pelin tila (per leg) ---
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
    startingPlayerIndex,
  });

  // --- Keskiarvo legeittäin ---
  const { getPlayerAverage, getPlayerTotals, resetMatchAverages } =
    useX01MatchAverages({
      turns: state.turns,
      isFinished,
    });

  // --- Match/set state on top of legs  ---
  const mainPlayerId = providedMainPlayerId ?? players[0]?.id ?? null;

  const {
    matchWins,
    setWins,
    legWins,
    matchWinnerId,
    isMatchFinished,
    currentLeg,
    currentSet,
    pendingMatchWin,
    pendingSetWin,
    handleNextLeg: advanceLeg,
    handleResetMatch: resetMatchState,
  } = useX01MatchState({
    players,
    bestOfLegs: useSets ? bestOfLegs : bestOf,
    bestOfSets: useSets ? bestOfSets : 1,
    useSets,
    isFinished,
    winnerId,
    startNextLeg,
    resetMatch,
  });

  // --- Stats prompts + per-leg summary for main player ---
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

  // --- Turn input handling (pending darts + preview score) ---
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

  // --- Aggregations across legs (attempts, totals, player stats) ---
  const {
    matchTotals,
    effectiveAttempts,
    playerStats,
    aggregateLegAttempts,
    resetAggregates,
    isTotalsAggregated,
  } = useX01MatchAggregates({
    players,
    gamePlayers,
    isFinished,
    isMatchFinished,
    winnerId,
    turns: state.turns,
    matchWins,
    getPlayerTotals,
    statsSummary,
    statsSaved,
    mainPlayerId,
  });

  // --- Match persistence (save once to Firestore) ---
  const { resetMatchPersistence } = useX01MatchPersistence({
    isMatchFinished,
    mainPlayerId,
    pendingDoubleTurn,
    matchTotals,
    matchWins,
    matchWinnerId,
    statsSaved,
    effectiveAttempts,
    isTotalsAggregated,
  });

  // --- Handlers ---
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
    resetAggregates();
    resetMatchPersistence();
    resetMatchState();
  };

  const handleGoHome = () => {
    navigation.navigate("Home");
  };

  // --- Derived values for UI ---
  const winner = gamePlayers.find((player) => player.id === winnerId) ?? null;
  const matchWinner =
    gamePlayers.find((player) => player.id === matchWinnerId) ?? null;

  // --- UI ---
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
          bestOfLegs={useSets ? bestOfLegs : bestOf}
          currentSet={currentSet}
          bestOfSets={useSets ? bestOfSets : 1}
          useSets={useSets}
          isFinished={isFinished}
          isMatchFinished={isMatchFinished}
          winnerName={winner?.name}
          matchWinnerName={matchWinner?.name}
          pendingMatchWin={pendingMatchWin}
          pendingSetWin={pendingSetWin}
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
          setWins={setWins}
          legWins={legWins}
          useSets={useSets}
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

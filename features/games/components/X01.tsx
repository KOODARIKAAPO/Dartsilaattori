import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Surface, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useX01Game } from "../hooks/useX01Game";
import { useX01Stats } from "../hooks/useX01Stats";
import { useX01MatchAverages } from "../hooks/useX01MatchAverages";
import DartsKeyboard from "./Dartskeyboard";
import X01BustPrompt from "./X01BustPrompt";
import X01HeaderCard from "./X01HeaderCard";
import X01ScoreCards from "./X01ScoreCards";
import type { X01Variant } from "../../../types/X01Types";

//Pää pelikomponentti. 

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
    undo,
    startNextLeg,
    resetMatch,
    reset,
  } = useX01Game({
    startingScore,
    players,
  });

  // Ottelun (best-of) tila: voitetut legiät per pelaaja
  const [matchWins, setMatchWins] = useState<Record<string, number>>(() =>
    players.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<string, number>
    )
  );
  // Ottelun voittaja (kun best-of täyttyy)
  const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);
  // Keskeneräisen vuoron heitot (1–3 tikkaa)
  const [pendingDarts, setPendingDarts] = useState<number[]>([]);

  // Ottelun tilalaskelmat
  const winsNeeded = Math.ceil(bestOf / 2);
  const legsPlayed = Object.values(matchWins).reduce(
    (sum, value) => sum + value,
    0
  );

  const winner = gamePlayers.find((player) => player.id === winnerId) ?? null;
  const matchWinner =
    gamePlayers.find((player) => player.id === matchWinnerId) ?? null;
  const isMatchFinished = matchWinnerId !== null;
  const currentLeg = Math.min(
    legsPlayed + (isMatchFinished ? 0 : 1),
    bestOf
  );
  const pendingMatchWin =
    winnerId != null
      ? (matchWins[winnerId] ?? 0) + 1 >= winsNeeded
      : false;
  // Vuoron kertymä (vaikuttaa reaaliaikaiseen pistetilanteeseen)
  const pendingTotal = pendingDarts.reduce((sum, dart) => sum + dart, 0);
  const showPending =
    pendingDarts.length > 0 && !isFinished && !isMatchFinished;
  const previewScore = (currentScore: number) => {
    if (!showPending) return currentScore;
    const remaining = currentScore - pendingTotal;
    return remaining >= 0 ? remaining : currentScore;
  };

  const { getPlayerAverage, resetMatchAverages } = useX01MatchAverages({
    turns: state.turns,
    isFinished,
  });

  const mainPlayerId = players[0]?.id ?? null;

  const {
    showStatsPrompt,
    dartsOnDouble,
    setDartsOnDouble,
    dartsToCheckout,
    setDartsToCheckout,
    showBustPrompt,
    handleBustDartsUsed,
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
  });

  useEffect(() => {
    // Best-of 1: merkitään ottelu valmiiksi heti legin päätyttyä
    if (bestOf !== 1) return;
    if (!isFinished || !winnerId) return;
    if (matchWinnerId) return;

    setMatchWins((prev) => ({
      ...prev,
      [winnerId]: (prev[winnerId] ?? 0) + 1,
    }));
    setMatchWinnerId(winnerId);
  }, [bestOf, isFinished, winnerId, matchWinnerId]);

  const handleThrow = (value: number, multiplier: 1 | 2 | 3) => {
    // Lisätään tikka vuoroon; vaihdetaan pelaaja vasta 3 heiton jälkeen
    if (isFinished || isMatchFinished) return;
    const points = value * multiplier;

    setPendingDarts((prev) => {
      if (prev.length >= 3) return prev;
      const next = [...prev, points];
      const total = next.reduce((sum, dart) => sum + dart, 0);
      const currentScore = currentPlayer?.currentScore ?? 0;
      const remaining = currentScore - total;

      if (remaining <= 0) {
        if (remaining === 0 && dartsToCheckout == null) {
          setDartsToCheckout(next.length);
        }
        submitPlayerTurn(total);
        return [];
      }

      if (next.length === 3) {
        // TODO: Tallenna vuoron kokonaispisteet ja tikkojen määrä (statistiikka)
        // TODO: Laske tuplien osumat ja tuplien yritykset
        submitPlayerTurn(total);
        return [];
      }

      return next;
    });
  };

  const handleUndo = () => {
    // Peru ensisijaisesti viimeisin tikka; jos ei ole, peru koko vuoro
    if (isMatchFinished) return;
    setPendingDarts((prev) => {
      if (prev.length > 0) {
        return prev.slice(0, -1);
      }
      undo();
      return prev;
    });
  };

  const handleResetLeg = () => {
    // Nollaa legi ja keskeneräiset heitot
    if (isMatchFinished) return;
    setPendingDarts([]);
    resetStatsTracking();
    reset();
  };

  const handleNextLeg = () => {
    // Kirjaa legin voitto ja siirry seuraavaan legiin
    if (!winnerId) return;
    // TODO: Tallenna legin/matsin tilastot backendille tässä vaiheessa
    const nextWins = {
      ...matchWins,
      [winnerId]: (matchWins[winnerId] ?? 0) + 1,
    };
    setMatchWins(nextWins);

    if (nextWins[winnerId] >= winsNeeded) {
      setMatchWinnerId(winnerId);
      return;
    }

    setPendingDarts([]);
    resetStatsTracking();
    startNextLeg();
  };

  const handleResetMatch = () => {
    // Nollaa koko ottelu (voitot + legi)
    // TODO: Varmista, ettei keskeneräinen ottelu ylikirjoita tallennettuja tilastoja
    const resetWins = players.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<string, number>
    );
    setMatchWins(resetWins);
    setMatchWinnerId(null);
    setPendingDarts([]);
    resetMatchAverages();
    resetStatsTracking();
    resetMatch();
  };

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
          statsPrompt={{
            visible: showStatsPrompt && isFinished && Boolean(winnerId),
            dartsOnDouble,
            dartsToCheckout,
            onSelectDartsOnDouble: setDartsOnDouble,
            onSelectDartsToCheckout: setDartsToCheckout,
            onSave: handleSaveStats,
            saving: statsSaving,
            saved: statsSaved,
            error: statsError,
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
          <DartsKeyboard
            onThrow={handleThrow}
            onUndo={handleUndo}
            onReset={handleResetLeg}
            inputPreview={pendingDarts}
          />
        </Surface>

        <X01BustPrompt
          visible={showBustPrompt}
          onSelect={handleBustDartsUsed}
        />

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

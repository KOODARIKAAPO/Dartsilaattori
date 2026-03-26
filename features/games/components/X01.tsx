import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {Button, Text, Surface, useTheme} from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useX01Game } from "../hooks/useX01Game";
import { useX01Stats } from "../hooks/useX01Stats";
import DartsKeyboard from "./Dartskeyboard";
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
    resetStatsTracking();
    resetMatch();
  };

  const renderBustPrompt = () => {
    if (!showBustPrompt) return null;

    return (
      <Surface style={styles.bustPrompt} elevation={1}>
        <Text variant="titleSmall" style={styles.bustPromptTitle}>
          Bust! Montako tikkaa heitit ennen bustia?
        </Text>
        <View style={styles.statsButtons}>
          {[1, 2, 3].map((value) => (
            <Button
              key={`bust-${value}`}
              mode="outlined"
              onPress={() => handleBustDartsUsed(value)}
              compact
              style={styles.statsButton}
            >
              {value}
            </Button>
          ))}
        </View>
      </Surface>
    );
  };

  const renderStatsPrompt = () => {
    if (!showStatsPrompt || !isFinished || !winnerId) return null;

    return (
      <Surface style={styles.statsPrompt} elevation={0}>
        <Text variant="titleSmall" style={styles.statsPromptTitle}>
          Tilastot (legin viimeinen vuoro)
        </Text>

        <View style={styles.statsRow}>
          <Text variant="bodyMedium" style={styles.statsLabel}>
            Montako tikkaa tuplaan?
          </Text>
          <View style={styles.statsButtons}>
            {[1, 2, 3].map((value) => (
              <Button
                key={`double-${value}`}
                mode={dartsOnDouble === value ? "contained" : "outlined"}
                onPress={() => setDartsOnDouble(value)}
                compact
                style={styles.statsButton}
              >
                {value}
              </Button>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text variant="bodyMedium" style={styles.statsLabel}>
            Montako tikkaa check-outiin?
          </Text>
          <View style={styles.statsButtons}>
            {[1, 2, 3].map((value) => (
              <Button
                key={`checkout-${value}`}
                mode={dartsToCheckout === value ? "contained" : "outlined"}
                onPress={() => setDartsToCheckout(value)}
                compact
                style={styles.statsButton}
              >
                {value}
              </Button>
            ))}
          </View>
        </View>

        {statsError ? (
          <Text variant="bodySmall" style={styles.statsError}>
            {statsError}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSaveStats}
          loading={statsSaving}
          disabled={
            statsSaving ||
            statsSaved ||
            dartsOnDouble == null ||
            dartsToCheckout == null
          }
          style={styles.statsSaveButton}
        >
          {statsSaved ? "Tallennettu" : "Tallenna tilastot"}
        </Button>
      </Surface>
    );
  };

  return (
    <Surface style={styles.root} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Yläkortti: vuorossa oleva pelaaja ja ottelun tila */}
        <Surface style={styles.headerCard} elevation={1}>
          {currentPlayer && !isFinished && !isMatchFinished && (
            <>
              <Text variant="titleMedium" style={styles.label}>
                Vuorossa
              </Text>
              <Text variant="headlineMedium" style={styles.currentPlayerName}>
                {currentPlayer.name}
              </Text>
              <Text variant="displaySmall" style={styles.currentPlayerScore}>
                {previewScore(currentPlayer.currentScore)}
              </Text>
              {checkout && (
                <Text variant="bodyMedium" style={styles.checkoutText}>
                  Ehdotus: {checkout.join(", ")}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.roundMeta}>
                Kierros {round} • Legi {currentLeg} / {bestOf}
              </Text>
            </>
          )}

          {isFinished && !isMatchFinished && (
            <>
              <Text variant="titleMedium" style={styles.finished}>
                Legi päättyi!
              </Text>
              {winner && (
                <Text variant="headlineSmall" style={styles.winnerText}>
                  Voittaja: {winner.name}
                </Text>
              )}
              {renderStatsPrompt()}
              {bestOf > 1 && (
                <Button
                  mode="contained"
                  onPress={handleNextLeg}
                  style={styles.nextLegButton}
                >
                  {pendingMatchWin ? "Päätä ottelu" : "Seuraava legi"}
                </Button>
              )}
            </>
          )}

          {isMatchFinished && (
            <>
              <Text variant="titleMedium" style={styles.finished}>
                Ottelu päättyi!
              </Text>
              {matchWinner && (
                <Text variant="headlineSmall" style={styles.winnerText}>
                  Voittaja: {matchWinner.name}
                </Text>
              )}
              {renderStatsPrompt()}
              <Button
                mode="outlined"
                textColor={outlinedTextColor}
                onPress={handleResetMatch}
                style={styles.nextLegButton}
              >
                Uusi ottelu
              </Button>
            </>
          )}
        </Surface>

        {/* Pistekortit: molempien pelaajien tilanne */}
        <View style={styles.scoreCards}>
          {gamePlayers.map((player) => {
            const isCurrent =
              currentPlayer != null && currentPlayer.id === player.id;
            const wins = matchWins[player.id] ?? 0;

            const displayScore = isCurrent
              ? previewScore(player.currentScore)
              : player.currentScore;

            return (
              <Surface
                key={player.id}
                style={[
                  styles.scoreCard,
                  isCurrent && styles.scoreCardActive,
                ]}
                elevation={1}
              >
                <Text
                  variant="titleSmall"
                  style={[
                    styles.scoreName,
                    isCurrent && styles.scoreNameActive,
                  ]}
                >
                  {player.name} • {wins} 
                </Text>
                <Text
                  variant="headlineMedium"
                  style={[
                    styles.scoreValue,
                    isCurrent && styles.scoreValueActive,
                  ]}
                >
                  {displayScore}
                </Text>
                {isCurrent && !isFinished && !isMatchFinished && (
                  <Text variant="bodySmall" style={styles.currentBadge}>
                    Vuorossa
                  </Text>
                )}
              </Surface>
            );
          })}
        </View>

        {/* Syöttö: heittojen kirjaus DartsKeyboardilla */}
        <Surface style={styles.inputCard} elevation={1}>
          <DartsKeyboard
            onThrow={handleThrow}
            onUndo={handleUndo}
            onReset={handleResetLeg}
          />
        </Surface>

        {renderBustPrompt()}

      </ScrollView>

      <View style={{ alignItems: "flex-end", marginBottom: 8 }}>

      </View>
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
    headerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    inputCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    roundMeta: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    currentPlayerName: {
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    currentPlayerScore: {
      color: theme.colors.onSurface,
    },
    checkoutText: {
      color: theme.colors.onSurface,
      marginTop: 4,
    },
    finished: {
      color: theme.colors.primary,
      marginBottom: 6,
    },
    winnerText: {
      color: theme.colors.onSurface,
    },
    nextLegButton: {
      marginTop: 12,
      alignSelf: "flex-start",
    },
    statsPrompt: {
      marginTop: 12,
      padding: 12,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      gap: 10,
    },
    statsPromptTitle: {
      color: theme.colors.onSurface,
    },
    statsRow: {
      gap: 8,
    },
    statsLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    statsButtons: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    statsButton: {
      minWidth: 56,
    },
    statsSaveButton: {
      alignSelf: "flex-start",
    },
    statsError: {
      color: theme.colors.error,
    },
    bustPrompt: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 12,
      gap: 10,
    },
    bustPromptTitle: {
      color: theme.colors.onSurface,
    },
    currentBadge: {
      color: theme.colors.onPrimaryContainer,
      marginTop: 2,
    },
    scoreCards: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    scoreCard: {
      flex: 1,
      minWidth: 150,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    scoreCardActive: {
      backgroundColor: theme.colors.primaryContainer,
    },
    scoreName: {
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    scoreNameActive: {
      color: theme.colors.onPrimaryContainer,
    },
    scoreValue: {
      color: theme.colors.onSurface,
    },
    scoreValueActive: {
      color: theme.colors.onPrimaryContainer,
    },
  });

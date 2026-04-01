import React from "react";
import { StyleSheet } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import X01StatsPrompt from "./X01StatsPrompt";
import X01StatsSummary from "./X01StatsSummary";

type StatsPromptProps = {
  visible: boolean;
  dartsToCheckout: number | null;
  onSelectDartsToCheckout: (value: number) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string | null;
};

type StatsSummaryProps = {
  visible: boolean;
  players: {
    id: string;
    name: string;
    average: number | null;
    dartsThrown: number | null;
    doublesAttempted: number | null;
    doublesHit: number | null;
  }[];
};

type Props = {
  showCurrentPlayer: boolean;
  currentPlayerName?: string;
  currentPlayerScore?: number;
  previewScore: (score: number) => number;
  checkout: string[] | null;
  round: number;
  currentLeg: number;
  bestOf: number;
  isFinished: boolean;
  isMatchFinished: boolean;
  winnerName?: string | null;
  matchWinnerName?: string | null;
  pendingMatchWin: boolean;
  outlinedTextColor: string;
  onNextLeg: () => void;
  onResetMatch: () => void;
  onGoHome: () => void;
  statsPrompt: StatsPromptProps;
  statsSummary: StatsSummaryProps;
};

export default function X01HeaderCard({
  showCurrentPlayer,
  currentPlayerName,
  currentPlayerScore,
  previewScore,
  checkout,
  round,
  currentLeg,
  bestOf,
  isFinished,
  isMatchFinished,
  winnerName,
  matchWinnerName,
  pendingMatchWin,
  outlinedTextColor,
  onNextLeg,
  onResetMatch,
  onGoHome,
  statsPrompt,
  statsSummary,
}: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // Yläkortti näyttää joko vuorossa olevan pelaajan tai legin/pelin lopun.
  return (
    <Surface style={styles.headerCard} elevation={1}>
      {showCurrentPlayer && currentPlayerScore != null ? (
        <>
          <Text variant="titleMedium" style={styles.label}>
            Vuorossa
          </Text>
          <Text variant="headlineMedium" style={styles.currentPlayerName}>
            {currentPlayerName}
          </Text>
          <Text variant="displaySmall" style={styles.currentPlayerScore}>
            {previewScore(currentPlayerScore)}
          </Text>
          {checkout ? (
            <Text variant="bodyMedium" style={styles.checkoutText}>
              Ehdotus: {checkout.join(", ")}
            </Text>
          ) : null}
          <Text variant="bodySmall" style={styles.roundMeta}>
            Kierros {round} • Legi {currentLeg} / {bestOf}
          </Text>
        </>
      ) : null}

      {isFinished && !isMatchFinished ? (
        <>
          <Text variant="titleMedium" style={styles.finished}>
            Legi päättyi!
          </Text>
          {winnerName ? (
            <Text variant="headlineSmall" style={styles.winnerText}>
              Voittaja: {winnerName}
            </Text>
          ) : null}
          <X01StatsPrompt {...statsPrompt} />
          {bestOf > 1 ? (
            <Button
              mode="contained"
              onPress={onNextLeg}
              style={styles.nextLegButton}
            >
              {pendingMatchWin ? "Päätä ottelu" : "Seuraava legi"}
            </Button>
          ) : null}
        </>
      ) : null}

      {isMatchFinished ? (
        <>
          <Text variant="titleMedium" style={styles.finished}>
            Ottelu päättyi!
          </Text>
          {matchWinnerName ? (
            <Text variant="headlineSmall" style={styles.winnerText}>
              Voittaja: {matchWinnerName}
            </Text>
          ) : null}
          <X01StatsPrompt {...statsPrompt} />
          <X01StatsSummary {...statsSummary} />
          <Button
            mode="outlined"
            textColor={outlinedTextColor}
            onPress={onResetMatch}
            style={styles.nextLegButton}
          >
            Uusi ottelu
          </Button>
          <Button
            mode="outlined"
            textColor={outlinedTextColor}
            onPress={onGoHome}
            style={styles.nextLegButton}
          >
            Koti
          </Button>
        </>
      ) : null}
    </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    headerCard: {
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
      minWidth: 140,
    },
  });

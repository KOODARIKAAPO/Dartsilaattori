import React from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

type PlayerCard = {
  id: string;
  name: string;
  currentScore: number;
};

type Props = {
  players: PlayerCard[];
  currentPlayerId: string | null;
  matchWins: Record<string, number>;
  previewScore: (score: number) => number;
  getPlayerAverage: (playerId: string) => number;
  isFinished: boolean;
  isMatchFinished: boolean;
};

export default function X01ScoreCards({
  players,
  currentPlayerId,
  matchWins,
  previewScore,
  getPlayerAverage,
  isFinished,
  isMatchFinished,
}: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // Pelaajakortit näyttävät pisteet, voitetut legiät ja ottelun keskiarvon.
  return (
    <View style={styles.scoreCards}>
      {players.map((player) => {
        const isCurrent =
          currentPlayerId != null && currentPlayerId === player.id;
        const wins = matchWins[player.id] ?? 0;

        const displayScore = isCurrent
          ? previewScore(player.currentScore)
          : player.currentScore;

        return (
          <Surface
            key={player.id}
            style={[styles.scoreCard, isCurrent && styles.scoreCardActive]}
            elevation={1}
          >
            <Text
              variant="titleSmall"
              style={[styles.scoreName, isCurrent && styles.scoreNameActive]}
            >
              {player.name} • {wins}
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.scoreValue, isCurrent && styles.scoreValueActive]}
            >
              {displayScore}
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.avgText, isCurrent && styles.avgTextActive]}
            >
              Avg {getPlayerAverage(player.id).toFixed(1)}
            </Text>
            {isCurrent && !isFinished && !isMatchFinished ? (
              <Text variant="bodySmall" style={styles.currentBadge}>
                Vuorossa
              </Text>
            ) : null}
          </Surface>
        );
      })}
    </View>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
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
    avgText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    avgTextActive: {
      color: theme.colors.onPrimaryContainer,
    },
    currentBadge: {
      color: theme.colors.onPrimaryContainer,
      marginTop: 2,
    },
  });

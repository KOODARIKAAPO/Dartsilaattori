import React from "react";
import { StyleSheet, View } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

type PlayerStats = {
  id: string;
  name: string;
  average: number | null;
  dartsThrown: number | null;
  doublesAttempted: number | null;
  doublesHit: number | null;
};

type Props = {
  visible: boolean;
  players: PlayerStats[];
};
//Pelaajille annetaan pelin statistiikka, pelkkä frontti 
export default function X01StatsSummary({ visible, players }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!visible || players.length === 0) return null;

  const formatValue = (value: number | null, digits = 0) => {
    if (value == null || Number.isNaN(value)) return "-";
    return value.toFixed(digits);
  };

  return (
    <Surface style={styles.card} elevation={0}>
      <Text variant="titleSmall" style={styles.title}>
        Ottelun tilastot
      </Text>
      {players.map((player) => {
        const doublesAttempted = player.doublesAttempted ?? null;
        const doublesHit = player.doublesHit ?? null;
        const hasDoubles =
          doublesAttempted != null &&
          doublesHit != null &&
          doublesAttempted >= 0;
        const doublesPercent = hasDoubles
          ? doublesAttempted > 0
            ? (doublesHit / doublesAttempted) * 100
            : 0
          : null;

        return (
          <View key={player.id} style={styles.playerBlock}>
            <Text variant="titleMedium" style={styles.playerName}>
              {player.name}
            </Text>
            <View style={styles.grid}>
              <View style={styles.item}>
                <Text variant="bodySmall" style={styles.label}>
                  Ottelun keskiarvo
                </Text>
                <Text variant="titleMedium" style={styles.value}>
                  {formatValue(player.average, 1)}
                </Text>
              </View>
              <View style={styles.item}>
                <Text variant="bodySmall" style={styles.label}>
                  Tikkoja yhteensa
                </Text>
                <Text variant="titleMedium" style={styles.value}>
                  {formatValue(player.dartsThrown, 0)}
                </Text>
              </View>
              <View style={styles.item}>
                <Text variant="bodySmall" style={styles.label}>
                  Tuplaprosentti
                </Text>
                <Text variant="titleMedium" style={styles.value}>
                  {formatValue(doublesPercent, 1)}
                  {doublesPercent == null ? "" : "%"}
                </Text>
              </View>
              <View style={styles.item}>
                <Text variant="bodySmall" style={styles.label}>
                  Tuplaheitot
                </Text>
                <Text variant="titleMedium" style={styles.value}>
                  {formatValue(player.doublesAttempted, 0)}
                </Text>
              </View>
              <View style={styles.item}>
                <Text variant="bodySmall" style={styles.label}>
                  Tuplaosumat
                </Text>
                <Text variant="titleMedium" style={styles.value}>
                  {formatValue(player.doublesHit, 0)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      marginTop: 12,
      padding: 12,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      gap: 12,
    },
    title: {
      color: theme.colors.onSurface,
    },
    playerBlock: {
      gap: 8,
    },
    playerName: {
      color: theme.colors.onSurface,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    item: {
      minWidth: 140,
      flexGrow: 1,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    value: {
      color: theme.colors.onSurface,
    },
  });

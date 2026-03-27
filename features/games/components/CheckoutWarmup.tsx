import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import DartsKeyboard from "./Dartskeyboard";
import { useCheckoutWarmup, Player } from "../hooks/useCheckoutWarmup";

interface Props {
  players: Player[];
}

export default function CheckoutWarmup({ players }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const {
    currentPlayer,
    currentCheckout,
    dartsThrown,
    turns,
    throwDart,
    undo,
    reset,
  } = useCheckoutWarmup(players);
  const dartsTotal = dartsThrown.reduce((sum, value) => sum + value, 0);
  const remaining = Math.max(currentCheckout - dartsTotal, 0);


  return (
    <Surface style={styles.root} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.headerCard} elevation={1}>
          <Text variant="titleMedium" style={styles.label}>
            Vuorossa
          </Text>
          <Text variant="headlineMedium" style={styles.currentPlayerName}>
            {currentPlayer.name}
          </Text>
          <Text variant="displaySmall" style={styles.checkoutValue}>
            {remaining}
          </Text>
          <Text variant="bodySmall" style={styles.checkoutHint}>
            Jäljellä • Tavoite {currentCheckout}
          </Text>
        </Surface>

        <Surface style={styles.inputCard} elevation={1}>
          <DartsKeyboard
            onThrow={(value, multiplier) => throwDart(value, multiplier)}
            onUndo={undo}
            onReset={reset}
            inputPreview={dartsThrown}
          />
        </Surface>

        <Surface style={styles.historyCard} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Suoritukset
          </Text>
          {turns.length === 0 ? (
            <Text variant="bodySmall" style={styles.muted}>
              Ei suorituksia vielä.
            </Text>
          ) : (
            turns.map((turn, index) => (
              <View key={`${turn.playerId}-${index}`} style={styles.turnRow}>
                <View style={styles.turnText}>
                  <Text variant="bodyMedium" style={styles.turnPlayer}>
                    {turn.playerName}
                  </Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    Tavoite {turn.checkout} • {turn.darts.join(", ")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.resultBadge,
                    turn.success ? styles.badgeSuccess : styles.badgeFail,
                  ]}
                >
                  <Text style={styles.resultText}>
                    {turn.success ? "OSUI" : "OHI"}
                  </Text>
                </View>
              </View>
            ))
          )}
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
    headerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    currentPlayerName: {
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    checkoutValue: {
      color: theme.colors.onSurface,
    },
    checkoutHint: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 6,
    },
    inputCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    historyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
      gap: 12,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
    },
    muted: {
      color: theme.colors.onSurfaceVariant,
    },
    turnRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    turnText: {
      flex: 1,
      gap: 2,
    },
    turnPlayer: {
      color: theme.colors.onSurface,
    },
    resultBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    resultText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    badgeSuccess: {
      backgroundColor: theme.colors.primary,
    },
    badgeFail: {
      backgroundColor: theme.colors.error,
    },
  });

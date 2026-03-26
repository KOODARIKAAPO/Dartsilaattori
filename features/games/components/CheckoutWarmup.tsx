import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Surface, useTheme } from "react-native-paper";
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


  return (
    <Surface style={styles.container} elevation={2}>
      <Text style={styles.title}>Checkout Warmup</Text>
      <Text style={styles.label}>Vuorossa: {currentPlayer.name}</Text>
      <Text style={styles.label}>Tavoite lopetus: {currentCheckout}</Text>
      <Text style={styles.label}>
        Heitetyt tikat: {dartsThrown.join(", ")}
      </Text>

      <DartsKeyboard
        onThrow={(value, multiplier) => throwDart(value, multiplier)}
        onUndo={undo}
        onReset={reset}
      />

      <View style={styles.turns}>
        <Text style={styles.subtitle}>Suoritukset:</Text>
        {turns.map((t, i) => (
          <Text key={i}>
            {t.playerName}: {t.darts.join(", ")} (tavoite {t.checkout}){" "}
            {t.success ? "✅" : "❌"}
          </Text>
        ))}
      </View>
    </Surface>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 16,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 12,
      marginBottom: 4,
      color: theme.colors.onSurfaceVariant,
    },
    label: {
      fontSize: 16,
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    turns: {
      marginTop: 12,
    },
  });
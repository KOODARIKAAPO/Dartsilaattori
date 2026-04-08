import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import DartsKeyboard from "./Dartskeyboard";
import { useBobs27 } from "../hooks/useBobs27";

export default function Bobs27() {
  const theme = useTheme();
  const styles = createStyles(theme);

  const { state, targets, throwDart, undo, reset } = useBobs27();
  const target = targets[state.targetIndex];
  const dartsLeft = Math.max(0, 3 - state.dartsThrown.length);

  const targetNumbers = target.isBull || !target.number ? [] : [target.number];

  return (
    <Surface style={styles.root} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.headerCard} elevation={1}>
          <Text variant="titleMedium" style={styles.label}>
            Bob's 27
          </Text>
          <Text variant="headlineMedium" style={styles.score}>
            {state.score}
          </Text>
          <Text variant="bodyMedium" style={styles.targetText}>
            Seuraava: {target.label} ({target.value})
          </Text>
          <Text variant="bodySmall" style={styles.subtle}>
            {dartsLeft} tikkaa jäljellä
          </Text>

          {state.gameOver && (
            <View style={styles.resultBox}>
              <Text variant="titleSmall" style={styles.resultText}>
                {state.result === "win"
                  ? "Hienoa! Kierros valmis."
                  : "Peli ohi – putosit nollaan."}
              </Text>
              <Button mode="contained" onPress={reset}>
                Uusi peli
              </Button>
            </View>
          )}
        </Surface>

        <Surface style={styles.inputCard} elevation={1}>
          <DartsKeyboard
            onThrow={throwDart}
            onUndo={undo}
            numbers={targetNumbers}
            showBull={Boolean(target.isBull)}
            showMiss={true}
            showReset={false}
            showMultipliers={false}
            lockedMultiplier={2}
            inputPreview={state.dartsThrown}
            disabled={state.gameOver}
          />
        </Surface>

        <Surface style={styles.historyCard} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Kierrokset
          </Text>
          {state.turns.length === 0 ? (
            <Text variant="bodySmall" style={styles.subtle}>
              Ei vielä suorituksia.
            </Text>
          ) : (
            state.turns.map((turn, index) => (
              <View key={`${turn.targetLabel}-${index}`} style={styles.turnRow}>
                <View style={styles.turnText}>
                  <Text variant="bodyMedium" style={styles.turnTitle}>
                    {turn.targetLabel} • {turn.hits}/3 osumaa
                  </Text>
                  <Text variant="bodySmall" style={styles.subtle}>
                    Heitot {turn.darts.map((d) => (d > 0 ? "OSUI" : "OHI")).join(", ")}
                  </Text>
                </View>
                <View style={styles.deltaBox}>
                  <Text
                    style={[
                      styles.deltaText,
                      turn.delta < 0 && styles.deltaNegative,
                    ]}
                  >
                    {turn.delta >= 0 ? `+${turn.delta}` : `${turn.delta}`}
                  </Text>
                  <Text style={styles.subtle}>Pisteet {turn.scoreAfter}</Text>
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
      gap: 6,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
    },
    score: {
      color: theme.colors.onSurface,
    },
    targetText: {
      color: theme.colors.onSurface,
    },
    subtle: {
      color: theme.colors.onSurfaceVariant,
    },
    resultBox: {
      marginTop: 12,
      gap: 8,
    },
    resultText: {
      color: theme.colors.onSurface,
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
    turnTitle: {
      color: theme.colors.onSurface,
    },
    deltaBox: {
      alignItems: "flex-end",
      gap: 2,
    },
    deltaText: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    deltaNegative: {
      color: theme.colors.error,
    },
  });

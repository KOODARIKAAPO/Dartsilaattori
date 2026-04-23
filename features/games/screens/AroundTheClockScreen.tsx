import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAroundTheClock } from "../hooks/useAroundTheClock";
import { DartKeyboard } from "../components/AtcKeyboard";
import { useAppTheme } from "../../../ui/ThemeContext";

export const AroundTheClockScreen = () => {
  const { theme } = useAppTheme()

  const styles = createStyles(theme)

  const game = useAroundTheClock({
    finishType: "bullseye",
  })

  const targetLabel =
    game.currentNumber === 21 ? "BULL" : game.currentNumber

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>TAVOITE</Text>
        <Text style={styles.target}>{targetLabel}</Text>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>Heitetyt tikat: {game.dartsThrown}</Text>
          <Text style={styles.stat}>Osuma prosentti: {game.hitRate.toFixed(1)}%</Text>
        </View>

        {game.lastHit && (
          <Text style={styles.lastHit}>Last: {game.lastHit}</Text>
        )}
      </View>

      {/* kortti näppäimistölle */}
      {!game.finished && (
        <View style={styles.card}>
          <DartKeyboard
            currentNumber={game.currentNumber}
            onThrow={game.handleThrow}
            onUndo={game.undo}
          />
        </View>
      )}

         {/* kortti pelin päätyttyä */}
      {game.finished && (
        <View style={styles.card}>
          <Text style={styles.gameOver}>Peli päättyi!</Text>

          <Text style={styles.finalStat}>
            Darts: {game.dartsThrown}
          </Text>
          <Text style={styles.finalStat}>
            Osuma prosentti: {game.hitRate.toFixed(1)}%
          </Text>

          <Pressable style={styles.resetBtn} onPress={game.resetGame}>
            <Text style={styles.resetText}>Pelaa uudelleen</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
      gap: 16,
    },

    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },

    label: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginBottom: 8,
      textAlign: "center",
    },

    target: {
      fontSize: 56,
      color: theme.colors.onSurface,
      fontWeight: "bold",
      textAlign: "center",
    },

    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 20,
    },

    stat: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "600",
    },

    lastHit: {
      marginTop: 12,
      textAlign: "center",
      color: theme.colors.onSurfaceVariant,
    },

    gameOver: {
      color: theme.colors.onSurface,
      fontSize: 24,
      textAlign: "center",
      marginBottom: 12,
      fontWeight: "bold",
    },

    finalStat: {
      color: theme.colors.onSurface,
      textAlign: "center",
      marginBottom: 6,
      fontSize: 16,
    },

    resetBtn: {
      marginTop: 20,
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },

    resetText: {
      color: theme.colors.onPrimary,
      fontWeight: "bold",
      fontSize: 16,
    },
  });
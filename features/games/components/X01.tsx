import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {Button, Text, TextInput, Surface, useTheme,} from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useX01Game } from "../hooks/useX01Game";
import { useScoreInput } from "../hooks/useScoreInput";
import Numpad from "../components/NumPad";
import { useNumpad } from "../hooks/useNumpad";
import DartsKeyboard from "../components/Dartskeyboard";

export function GameScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { currentScore, turns, isFinished, addThrow, undoThrow, reset } =
    useX01Game(501);

  const { value, setValue, parsedValue, isValid, clear } = useScoreInput();

  const handleSubmit = () => {
    if (parsedValue === null) return;
    addThrow(parsedValue);
    clear();
  };

  const [keyboardType, setKeyboardType] = useState<"numpad" | "darts">("numpad");


  // Näppämistön napit, handleNumberPress ja handleBackspace
  const handleNumberPress = (num: number) => {
  setValue(prev => prev + num.toString());
};

const handleBackspace = () => {
  setValue(prev => prev.slice(0, -1));
};

  return (
    <Surface style={styles.root} elevation={0}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.label}>
          Jäljellä
        </Text>
        <Text variant="headlineLarge" style={styles.score}>
          {currentScore}
        </Text>
        {isFinished && (
          <Text variant="titleMedium" style={styles.finished}>
            Peli päättyi!
          </Text>
        )}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          label="Syötä pisteet"
          value={value}
          onChangeText={setValue}
          editable={false}
          keyboardType="numeric"
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!isValid}
          style={styles.primaryButton}
        >
          Lisää
        </Button>
      </View>

      <View style={styles.actionsRow}>
        <Button mode="outlined" onPress={undoThrow} style={styles.actionButton}>
          Peru viimeisin
        </Button>
        <Button
          mode="outlined"
          onPress={() => reset()}
          style={styles.actionButton}
        >
          Resetoi peli
        </Button>
      </View>

      <View style={styles.turnsHeader}>
        <Text variant="titleSmall" style={styles.label}>
          Heitot
        </Text>
      </View>

      <ScrollView style={styles.turnsList} contentContainerStyle={styles.turns}>
        {turns.length === 0 && (
          <Text variant="bodyMedium" style={styles.muted}>
            Ei vielä heittoja.
          </Text>
        )}
        {turns.map((turn, index) => (
          <Surface key={index} style={styles.turnItem} elevation={1}>
            <Text variant="bodyMedium" style={styles.turnText}>
              {turn.previousScore} - {turn.points} = {turn.newScore}
            </Text>
          </Surface>
        ))}
      </ScrollView>

      <View style={{ alignItems: "flex-end", marginBottom: 8 }}>
  <Button
    mode="outlined"
    onPress={() =>
      setKeyboardType(prev => (prev === "numpad" ? "darts" : "numpad"))
    }
  >
    {keyboardType === "numpad" ? "Darts-näppäimistö" : "Numeronäppäimistö"}
  </Button>
</View>

      {keyboardType === "numpad" ? (
    <Numpad
      onNumberPress={handleNumberPress}
      onBackspace={handleBackspace}
    />
    ) : (
    <DartsKeyboard
        onThrow={(value, multiplier) => {
         addThrow(value * multiplier);
       }}
       onUndo={undoThrow}
       onReset={reset}
      />
      )}
      </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
      marginBottom: 16,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    score: {
      color: theme.colors.onSurface,
    },
    finished: {
      marginTop: 8,
      color: theme.colors.primary,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    primaryButton: {
      alignSelf: "stretch",
      justifyContent: "center",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
    },
    turnsHeader: {
      marginBottom: 8,
    },
    turnsList: {
      flex: 1,
    },
    turns: {
      paddingBottom: 12,
      gap: 8,
    },
    turnItem: {
      padding: 12,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
    },
    turnText: {
      color: theme.colors.onSurface,
    },
    muted: {
      color: theme.colors.onSurfaceVariant,
    },
  });

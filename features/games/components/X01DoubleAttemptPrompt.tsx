import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

type Props = {
  visible: boolean;
  playerName?: string | null;
  onSelect: (value: number) => void;
};
//pelaajalta kysytään montako tikkaa tuplaan
export default function X01DoubleAttemptPrompt({ visible, onSelect,}: Props) {
  
  if (!visible) return null;
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Surface style={styles.prompt} elevation={1}>
      <Text variant="titleSmall" style={styles.title}>
        Montako tikkaa tuplaan?
      </Text>
      <View style={styles.buttons}>
        {[0, 1, 2, 3].map((value) => (
          <Button
            key={`double-attempt-${value}`}
            mode="outlined"
            onPress={() => onSelect(value)}
            compact
            style={styles.button}
          >
            {value}
          </Button>
        ))}
      </View>
    </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    prompt: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 12,
      gap: 8,
    },
    title: {
      color: theme.colors.onSurface,
    },
    buttons: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    button: {
      minWidth: 56,
    },
  });

import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

type Props = {
  visible: boolean;
  onSelect: (value: number) => void;
};

export default function X01BustPrompt({ visible, onSelect }: Props) {
  if (!visible) return null;
  const theme = useTheme();
  const styles = createStyles(theme);

  // Bust-promptti: kysyy montako tikkaa heitettiin ennen bustia.
  return (
    <Surface style={styles.bustPrompt} elevation={1}>
      <Text variant="titleSmall" style={styles.bustPromptTitle}>
        Bust! Montako tikkaa heitit ennen bustia?
      </Text>
      <View style={styles.buttons}>
        {[1, 2, 3].map((value) => (
          <Button
            key={`bust-${value}`}
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
    bustPrompt: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 12,
      gap: 10,
    },
    bustPromptTitle: {
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

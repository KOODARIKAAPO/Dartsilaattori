import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAppTheme } from "../../../ui/ThemeContext";

interface Props {
  currentNumber: number
  onThrow: (segment: "single" | "double" | "triple" | "miss" | "bull" | "outerBull") => void
  onUndo?: () => void
}

export const DartKeyboard = ({ currentNumber, onThrow, onUndo }: Props) => {
  const { theme } = useAppTheme()
  const styles = createStyles(theme)

  const isBull = currentNumber === 21

  const buttons = isBull
    ? [
        { label: "S-BULL", value: "outerBull" },
        { label: "BULL", value: "bull" },
        { label: "MISS", value: "miss" },
      ]
    : [
        { label: `S${currentNumber}`, value: "single" },
        { label: `D${currentNumber}`, value: "double" },
        { label: `T${currentNumber}`, value: "triple" },
        { label: "MISS", value: "miss" },
      ]

  if (onUndo) {
    buttons.push({ label: "UNDO", value: "undo" })
  }

  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <Pressable
          key={btn.label}
          onPress={() => {
            if (btn.value === "undo" && onUndo) {
              onUndo();
            } else {
              onThrow(btn.value as any)
            }
          }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.text}>{btn.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },

    button: {
      flexBasis: "48%",
      backgroundColor: theme.colors.surfaceVariant,
      paddingVertical: 18,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    buttonPressed: {
      opacity: 0.6,
      transform: [{ scale: 0.97 }],
    },

    text: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: "bold",
      fontSize: 16,
    },
  });
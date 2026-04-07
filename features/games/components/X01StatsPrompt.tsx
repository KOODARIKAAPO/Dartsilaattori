import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

type Props = {
  visible: boolean;
  dartsToCheckout: number | null;
  onSelectDartsToCheckout: (value: number) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string | null;
};

export default function X01StatsPrompt({
  visible,
  dartsToCheckout,
  onSelectDartsToCheckout,
  onSave,
  saving,
  saved,
  error,
}: Props) {
  if (!visible) return null;
  const theme = useTheme();
  const styles = createStyles(theme);

  // Checkoutin promptti: checkout-tikat ja tallennus.
  return (
    <Surface style={styles.statsPrompt} elevation={0}>
      <Text variant="titleSmall" style={styles.statsPromptTitle}>
        Tilastot (ottelun viimeinen vuoro)
      </Text>

      <View style={styles.row}>
        <Text variant="bodyMedium" style={styles.label}>
          Montako tikkaa check-outiin?
        </Text>
        <View style={styles.buttons}>
          {[1, 2, 3].map((value) => (
            <Button
              key={`checkout-${value}`}
              mode={dartsToCheckout === value ? "contained" : "outlined"}
              onPress={() => onSelectDartsToCheckout(value)}
              compact
              style={styles.button}
            >
              {value}
            </Button>
          ))}
        </View>
      </View>

      {error ? (
        <Text variant="bodySmall" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={
          saving ||
          saved ||
          dartsToCheckout == null
        }
        style={styles.saveButton}
      >
        {saved ? "Vahvistettu" : "Vahvista tiedot"}
      </Button>
    </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    statsPrompt: {
      marginTop: 12,
      padding: 12,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      gap: 10,
    },
    statsPromptTitle: {
      color: theme.colors.onSurface,
    },
    row: {
      gap: 8,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
    },
    buttons: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    button: {
      minWidth: 56,
    },
    saveButton: {
      alignSelf: "flex-start",
    },
    error: {
      color: theme.colors.error,
    },
  });

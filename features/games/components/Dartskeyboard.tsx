import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

type Multiplier = 1 | 2 | 3;

type PreviewItem =
  | number
  | {
      points: number;
      label?: string;
    };

interface Props {
  onThrow: (value: number, multiplier: Multiplier) => void;
  onUndo: () => void;
  onReset?: () => void;
  disabled?: boolean;
  numbers?: number[];
  showBull?: boolean;
  showMiss?: boolean;
  showReset?: boolean;
  showMultipliers?: boolean;
  lockedMultiplier?: Multiplier;
  inputPreview?: PreviewItem[];
}

const BUTTON_GAP = 8;
const GRID_COLUMNS = 7;

function getPreviewValue(item: PreviewItem) {
  return typeof item === "number" ? item : item.points;
}

function getPreviewLabel(item: PreviewItem) {
  if (typeof item === "number") {
    return String(item);
  }

  return item.label ?? String(item.points);
}

export default function DartsKeyboard({
  onThrow,
  onUndo,
  onReset,
  disabled = false,
  numbers = Array.from({ length: 20 }, (_, i) => i + 1),
  showBull = true,
  showMiss = true,
  showReset = true,
  showMultipliers = true,
  lockedMultiplier,
  inputPreview,
}: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const keyboardWidth = Math.min(Math.max(width - 48, 280), 420);
  const buttonSize =
    (keyboardWidth - BUTTON_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const styles = createStyles(theme, keyboardWidth, buttonSize);
  const isDisabled = Boolean(disabled);
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const [localPreview, setLocalPreview] = useState<number[]>([]);

  const preview: PreviewItem[] = inputPreview ?? localPreview;
  const previewTotal = useMemo(
    () => preview.reduce<number>((sum, item) => sum + getPreviewValue(item), 0),
    [preview]
  );
  const previewText = useMemo(
    () => (preview.length > 0 ? preview.map(getPreviewLabel).join(" + ") : "-"),
    [preview]
  );

  const pushPreview = (value: number) => {
    if (inputPreview) return;
    setLocalPreview((prev) => {
      const next = [...prev, value];
      return next.length >= 3 ? [] : next;
    });
  };

  const handlePress = (num: number) => {
    if (isDisabled) return;
    const activeMultiplier = lockedMultiplier ?? multiplier;
    const value = num * activeMultiplier;
    onThrow(num, activeMultiplier);
    pushPreview(value);
    if (!lockedMultiplier) setMultiplier(1);
  };

  const handleBull = (isInner: boolean) => {
    if (isDisabled) return;
    const value = 25;
    const multi = isInner ? 2 : 1;

    onThrow(value, multi);
    pushPreview(value * multi);
    if (!lockedMultiplier) setMultiplier(1);
  };

  const handleUndoPress = () => {
    if (isDisabled) return;
    onUndo();
    if (!inputPreview) {
      setLocalPreview((prev) => prev.slice(0, -1));
    }
  };

  const handleResetPress = () => {
    if (isDisabled) return;
    onReset?.();
    if (!inputPreview) {
      setLocalPreview([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>Heitot</Text>
        <Text style={styles.previewValue}>{previewText}</Text>
        <Text style={styles.previewTotal}>Yht: {previewTotal}</Text>
      </View>

      <View style={styles.grid}>
        {numbers.map((num) => (
          <TouchableOpacity
            key={num}
            style={[styles.numberButton, isDisabled && styles.buttonDisabled]}
            onPress={() => handlePress(num)}
            disabled={isDisabled}
          >
            <Text style={styles.buttonText}>{num}</Text>
          </TouchableOpacity>
        ))}

        {showBull && (
          <>
            <TouchableOpacity
              style={[
                styles.numberButton,
                styles.bullOuter,
                isDisabled && styles.buttonDisabled,
              ]}
              onPress={() => handleBull(false)}
              disabled={isDisabled}
            >
              <Text style={styles.buttonText}>25</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.numberButton,
                styles.bullInner,
                isDisabled && styles.buttonDisabled,
              ]}
              onPress={() => handleBull(true)}
              disabled={isDisabled}
            >
              <Text style={styles.buttonText}>BULL</Text>
            </TouchableOpacity>
          </>
        )}

        {showMiss && (
          <TouchableOpacity
            style={[styles.numberButton, styles.miss, isDisabled && styles.buttonDisabled]}
            onPress={() => handlePress(0)}
            disabled={isDisabled}
          >
            <Text style={styles.buttonText}>MISS</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        {showMultipliers && (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                multiplier === 2 && styles.activeDouble,
                isDisabled && styles.buttonDisabled,
              ]}
              onPress={() => setMultiplier(2)}
              disabled={isDisabled}
            >
              <Text style={styles.actionText}>DOUBLE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                multiplier === 3 && styles.activeTriple,
                isDisabled && styles.buttonDisabled,
              ]}
              onPress={() => setMultiplier(3)}
              disabled={isDisabled}
            >
              <Text style={styles.actionText}>TRIPLE</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.actionButton, isDisabled && styles.buttonDisabled]}
          onPress={handleUndoPress}
          disabled={isDisabled}
        >
          <Text style={styles.actionText}>UNDO</Text>
        </TouchableOpacity>

        {showReset && onReset && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isDisabled && styles.buttonDisabled,
            ]}
            onPress={handleResetPress}
            disabled={isDisabled}
          >
            <Text style={styles.actionText}>RESET</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (
  theme: MD3Theme,
  keyboardWidth: number,
  buttonSize: number
) =>
  StyleSheet.create({
    container: {
      paddingVertical: 10,
      gap: 10,
    },
    previewBox: {
      alignSelf: "center",
      width: keyboardWidth,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 2,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    previewLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    previewValue: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 2,
    },
    previewTotal: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
      marginTop: 1,
    },
    grid: {
      alignSelf: "center",
      width: keyboardWidth,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: BUTTON_GAP,
    },
    numberButton: {
      width: buttonSize,
      height: buttonSize,
      backgroundColor: theme.colors.elevation.level2,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: buttonSize / 2,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    buttonText: {
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: "700",
    },
    bullOuter: {
      backgroundColor: theme.colors.tertiaryContainer,
      borderColor: theme.colors.tertiary,
    },
    bullInner: {
      backgroundColor: theme.colors.secondaryContainer,
      borderColor: theme.colors.secondary,
    },
    miss: {
      backgroundColor: theme.colors.surfaceDisabled,
      borderColor: theme.colors.outline,
    },
    actions: {
      alignSelf: "center",
      width: keyboardWidth,
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: 999,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    actionText: {
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    activeDouble: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    activeTriple: {
      backgroundColor: theme.colors.secondaryContainer,
      borderColor: theme.colors.secondary,
    },
  });

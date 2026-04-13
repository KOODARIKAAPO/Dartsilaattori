import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

import DartsKeyboard from "../components/Dartskeyboard";

type Multiplier = 1 | 2 | 3;

type DartThrow = {
  value: number;
  multiplier: Multiplier;
  points: number;
  label: string;
};

type StageConfig = {
  score: number;
  darts: number;
};

type TurnRecord = {
  stageLabel: string;
  darts: DartThrow[];
  startScore: number;
  endScore: number;
  bust: boolean;
  won: boolean;
};

const MAX_DARTS_PER_TURN = 3;
const STAGES: StageConfig[] = [
  { score: 101, darts: 9 },
  { score: 201, darts: 12 },
  { score: 301, darts: 15 },
  { score: 401, darts: 18 },
  { score: 501, darts: 21 },
];

function getThrowLabel(value: number, multiplier: Multiplier): string {
  if (value === 0) return "MISS";
  if (value === 25 && multiplier === 2) return "BULL";
  if (value === 25) return "25";
  if (multiplier === 1) return `${value}`;
  if (multiplier === 2) return `D${value}`;
  return `T${value}`;
}

function formatTurnSummary(darts: DartThrow[]): string {
  if (darts.length === 0) return "-";
  return darts.map((dart) => dart.label).join(" ").trim();
}

function getTurnBadgeLabel(turn: TurnRecord): string {
  if (turn.won) return "CLEAR";
  if (turn.bust) return "BUST";
  return `${turn.darts.reduce((sum, dart) => sum + dart.points, 0)} p`;
}

function getInitialStageState() {
  return {
    stageIndex: 0,
    score: STAGES[0].score,
    stageDartLimit: STAGES[0].darts,
    dartsUsed: 0,
    turns: [] as TurnRecord[],
    isFinished: false,
    resetReason: null as string | null,
    pendingDarts: [] as DartThrow[],
    advanceMessage: null as string | null,
  };
}

export default function Screen101() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const outlinedTextColor = theme.colors.onSurface;

  const [stageIndex, setStageIndex] = useState(0);
  const [score, setScore] = useState(STAGES[0].score);
  const [stageDartLimit, setStageDartLimit] = useState(STAGES[0].darts);
  const [dartsUsed, setDartsUsed] = useState(0);
  const [pendingDarts, setPendingDarts] = useState<DartThrow[]>([]);
  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [resetReason, setResetReason] = useState<string | null>(null);
  const [advanceMessage, setAdvanceMessage] = useState<string | null>(null);

  const currentStage = STAGES[stageIndex];
  const bonusDarts = Math.max(stageDartLimit - currentStage.darts, 0);
  const stageLabel = `${currentStage.score} / ${stageDartLimit}`;
  const stageNumber = stageIndex + 1;
  const dartsLeft = stageDartLimit - dartsUsed;
  const previewScore = Math.max(
    score - pendingDarts.reduce((sum, dart) => sum + dart.points, 0),
    0
  );
  const totalThrownDarts =
    turns.reduce((sum, turn) => sum + turn.darts.length, 0) +
    pendingDarts.length;

  const resetRun = (reason?: string) => {
    const initial = getInitialStageState();
    setStageIndex(initial.stageIndex);
    setScore(initial.score);
    setStageDartLimit(initial.stageDartLimit);
    setDartsUsed(initial.dartsUsed);
    setPendingDarts(initial.pendingDarts);
    setTurns(initial.turns);
    setIsFinished(initial.isFinished);
    setResetReason(reason ?? initial.resetReason);
    setAdvanceMessage(initial.advanceMessage);
  };

  const advanceToNextStage = (savedDarts: number) => {
    const nextIndex = stageIndex + 1;

    if (nextIndex >= STAGES.length) {
      setPendingDarts([]);
      setIsFinished(true);
      setAdvanceMessage(null);
      setResetReason(null);
      return;
    }

    const nextStage = STAGES[nextIndex];
    const nextLimit = nextStage.darts + savedDarts;

    setStageIndex(nextIndex);
    setScore(nextStage.score);
    setStageDartLimit(nextLimit);
    setDartsUsed(0);
    setPendingDarts([]);
    setResetReason(null);
    setAdvanceMessage(
      `Seuraavaksi: ${nextStage.score} pisteestä alas ${nextLimit} tikalla.`
    );
  };

  const failRun = (reason: string) => {
    resetRun(reason);
  };

  const finalizeTurn = (darts: DartThrow[], bust: boolean, won: boolean) => {
    const total = darts.reduce((sum, dart) => sum + dart.points, 0);
    const nextScore = won ? 0 : bust ? score : score - total;
    const nextDartsUsed = dartsUsed + darts.length;
    const ranOutOfDarts = nextDartsUsed >= stageDartLimit;

    setTurns((prev) => [
      {
        stageLabel,
        darts,
        startScore: score,
        endScore: nextScore,
        bust,
        won,
      },
      ...prev,
    ]);
    setPendingDarts([]);
    setDartsUsed(nextDartsUsed);

    if (won) {
      const savedDarts = Math.max(stageDartLimit - nextDartsUsed, 0);
      setScore(0);
      advanceToNextStage(savedDarts);
      return;
    }

    if (bust) {
      if (ranOutOfDarts) {
        failRun(`Et saanut tarvittavaa tulosta ${stageDartLimit} tikalla.`);
      } else {
        setResetReason(null);
        setAdvanceMessage(null);
      }
      return;
    }

    setScore(nextScore);
    setAdvanceMessage(null);
    setResetReason(null);

    if (ranOutOfDarts) {
      failRun(`Et saanut tarvittavaa tulosta ${stageDartLimit} tikalla.`);
    }
  };

  const handleThrow = (value: number, multiplier: Multiplier) => {
    if (isFinished) return;

    const points = value * multiplier;
    const dart: DartThrow = {
      value,
      multiplier,
      points,
      label: getThrowLabel(value, multiplier),
    };

    const nextDarts = [...pendingDarts, dart];
    const remaining =
      score - nextDarts.reduce((sum, item) => sum + item.points, 0);

    if (remaining < 0 || remaining === 1) {
      finalizeTurn(nextDarts, true, false);
      return;
    }

    if (remaining === 0) {
      const won = multiplier === 2;
      finalizeTurn(nextDarts, !won, won);
      return;
    }

    setResetReason(null);
    setAdvanceMessage(null);

    if (nextDarts.length >= MAX_DARTS_PER_TURN) {
      finalizeTurn(nextDarts, false, false);
      return;
    }

    if (dartsUsed + nextDarts.length >= stageDartLimit) {
      finalizeTurn(nextDarts, false, false);
      return;
    }

    setPendingDarts(nextDarts);
  };

  const handleUndo = () => {
    if (isFinished) return;
    setPendingDarts((prev) => prev.slice(0, -1));
    setResetReason(null);
    setAdvanceMessage(null);
  };

  const handleReset = () => {
    resetRun();
  };

  return (
    <Surface style={styles.root} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.headerCard} elevation={1}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text variant="headlineSmall" style={styles.stageTitle}>
                Taso {stageNumber}: {currentStage.score}
              </Text>
            </View>
          </View>

          <View style={styles.scorePanel}>
            <Text variant="labelLarge" style={styles.scoreLabel}>
              Jäljellä
            </Text>
            <Text variant="displaySmall" style={styles.scoreValue}>
              {isFinished ? 0 : previewScore}
            </Text>
          </View>

          {advanceMessage && !isFinished && (
            <View style={styles.messageChipSuccess}>
              <Text variant="bodyLarge" style={styles.successText}>
                {advanceMessage}
              </Text>
            </View>
          )}

          {resetReason && !isFinished && (
            <View style={styles.messageChipError}>
              <Text variant="bodyLarge" style={styles.failText}>
                {resetReason}
              </Text>
            </View>
          )}

          {isFinished && (
            <View style={styles.finishedRow}>
              <Text variant="headlineSmall" style={styles.finishedText}>
                Kaikki tasot suoritettu!
              </Text>
              <Button mode="contained" onPress={handleReset}>
                Aloita uudestaan
              </Button>
            </View>
          )}
        </Surface>

        <Surface style={styles.statsCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Tilanne
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="labelMedium" style={styles.statLabel}>
                Taso
              </Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stageNumber}/{STAGES.length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="labelMedium" style={styles.statLabel}>
                Tikkoja jäljellä
              </Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {isFinished ? 0 : Math.max(dartsLeft, 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="labelMedium" style={styles.statLabel}>
                Bonus tikat
              </Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {bonusDarts}
              </Text>
            </View>
          </View>
        </Surface>

        <Surface style={styles.inputCard} elevation={1}>
          <DartsKeyboard
            onThrow={handleThrow}
            onUndo={handleUndo}
            onReset={handleReset}
            inputPreview={pendingDarts}
          />
        </Surface>

        <Surface style={styles.progressCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Tasot
          </Text>
          <View style={styles.progressList}>
            {STAGES.map((stage, index) => {
              const isCurrent = index === stageIndex && !isFinished;
              const isDone = index < stageIndex || isFinished;
              const limitLabel =
                isCurrent || (isFinished && index === STAGES.length - 1)
                  ? `${stageDartLimit} tikkaa`
                  : `${stage.darts} tikkaa`;

              return (
                <View
                  key={`${stage.score}-${stage.darts}`}
                  style={[
                    styles.progressItem,
                    isCurrent && styles.progressItemCurrent,
                    isDone && styles.progressItemDone,
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.progressTitle,
                      isCurrent && styles.progressTitleCurrent,
                      isDone && styles.progressTitleDone,
                    ]}
                  >
                    {stage.score}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.progressMeta,
                      isCurrent && styles.progressTitleCurrent,
                      isDone && styles.progressMetaDone,
                    ]}
                  >
                    {limitLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>

        <Surface style={styles.historyCard} elevation={1}>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Vuorohistoria
            </Text>
            <Button
              mode="text"
              textColor={outlinedTextColor}
              onPress={handleReset}
            >
              Aloita alusta
            </Button>
          </View>

          <View style={styles.historySummaryRow}>
            <View style={styles.historySummaryItem}>
              <Text variant="labelMedium" style={styles.statLabel}>
                Vuoroja
              </Text>
              <Text variant="titleLarge" style={styles.historySummaryValue}>
                {turns.length}
              </Text>
            </View>
            <View style={styles.historySummaryItem}>
              <Text variant="labelMedium" style={styles.statLabel}>
                Heitetyt tikat
              </Text>
              <Text variant="titleLarge" style={styles.historySummaryValue}>
                {totalThrownDarts}
              </Text>
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.helperText}>
            Saat rajatun määrän tikkoja per taso. Yli jääneet tikat siirtyvät
            bonuksena seuraavaan tasoon. Lopetus tehdään tuplalla, ja jos taso
            jää kesken, peli alkaa alusta.
          </Text>

          {turns.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Ei vielä kirjattuja vuoroja.
            </Text>
          ) : (
            <View style={styles.historyList}>
              {turns.map((turn, index) => (
                <View
                  key={`${turn.stageLabel}-${turn.startScore}-${index}`}
                  style={styles.historyRow}
                >
                  <View style={styles.historyMain}>
                    <Text variant="titleSmall" style={styles.historyScore}>
                      {turn.stageLabel}: {turn.startScore} {"->"} {turn.endScore}
                    </Text>
                    <Text variant="bodyMedium" style={styles.historyThrows}>
                      {formatTurnSummary(turn.darts)}
                    </Text>
                  </View>
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.historyBadge,
                      turn.won && styles.historyBadgeWin,
                      turn.bust && styles.historyBadgeBust,
                    ]}
                  >
                    {getTurnBadgeLabel(turn)}
                  </Text>
                </View>
              ))}
            </View>
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
      borderRadius: theme.roundness * 3,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    heroCopy: {
      flex: 1,
      gap: 4,
    },
    stageBadge: {
      minWidth: 110,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.primaryContainer,
      gap: 2,
    },
    stageBadgeLabel: {
      color: theme.colors.onPrimaryContainer,
    },
    stageBadgeValue: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: "700",
    },
    scorePanel: {
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: theme.roundness * 2,
      padding: 16,
      gap: 6,
    },
    scoreLabel: {
      color: theme.colors.onSurfaceVariant,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    statsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
      gap: 12,
    },
    progressCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
      gap: 12,
    },
    inputCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 12,
      gap: 10,
    },
    historyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
      gap: 12,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
    },
    stageTitle: {
      color: theme.colors.onSurface,
    },
    scoreValue: {
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    helperText: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    messageChipSuccess: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    messageChipError: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    successText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: "600",
    },
    failText: {
      color: theme.colors.onErrorContainer,
      fontWeight: "600",
    },
    finishedRow: {
      gap: 12,
      marginTop: 8,
    },
    finishedText: {
      color: theme.colors.primary,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    statItem: {
      flex: 1,
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: theme.roundness * 1.5,
      padding: 12,
      gap: 4,
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    statValue: {
      color: theme.colors.onSurface,
    },
    progressList: {
      flexDirection: "row",
      gap: 8,
    },
    progressItem: {
      flex: 1,
      borderRadius: theme.roundness * 1.5,
      padding: 12,
      backgroundColor: theme.colors.elevation.level2,
      gap: 4,
    },
    progressItemCurrent: {
      backgroundColor: theme.colors.primaryContainer,
    },
    progressItemDone: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    progressTitle: {
      color: theme.colors.onSurface,
    },
    progressTitleCurrent: {
      color: theme.colors.onPrimaryContainer,
    },
    progressTitleDone: {
      color: theme.colors.onSecondaryContainer,
    },
    progressMeta: {
      color: theme.colors.onSurfaceVariant,
    },
    progressMetaDone: {
      color: theme.colors.onSecondaryContainer,
    },
    inputHeader: {
      gap: 2,
      paddingHorizontal: 4,
    },
    inputHelper: {
      color: theme.colors.onSurfaceVariant,
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    historySummaryRow: {
      flexDirection: "row",
      gap: 12,
    },
    historySummaryItem: {
      flex: 1,
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: theme.roundness * 1.5,
      padding: 12,
      gap: 4,
    },
    historySummaryValue: {
      color: theme.colors.onSurface,
    },
    historyList: {
      gap: 10,
    },
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    historyMain: {
      flex: 1,
      gap: 4,
    },
    historyScore: {
      color: theme.colors.onSurface,
    },
    historyThrows: {
      color: theme.colors.onSurfaceVariant,
    },
    historyBadge: {
      color: theme.colors.primary,
      minWidth: 72,
      textAlign: "right",
    },
    historyBadgeWin: {
      color: theme.colors.primary,
    },
    historyBadgeBust: {
      color: theme.colors.error,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
    },
  });

import React, { useMemo, useState } from "react";
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

  const pendingTotal = useMemo(
    () => pendingDarts.reduce((sum, dart) => sum + dart.points, 0),
    [pendingDarts]
  );
  const previewScore = Math.max(score - pendingTotal, 0);
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
      `Taso lapi! Seuraava tavoite: ${nextStage.score} pisteesta alas ${nextLimit} tikalla.`
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
        failRun(`Et saanut ${currentStage.score}:aa ${stageDartLimit} tikalla.`);
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
      failRun(`Et saanut ${currentStage.score}:aa ${stageDartLimit} tikalla.`);
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
          <Text variant="titleMedium" style={styles.label}>
            X01 Challenge
          </Text>
          <Text variant="headlineSmall" style={styles.stageTitle}>
            Taso {stageNumber}: {currentStage.score}
          </Text>
          <Text variant="displaySmall" style={styles.scoreValue}>
            {isFinished ? 0 : previewScore}
          </Text>
          <Text variant="bodyMedium" style={styles.helperText}>
            Saat rajatun maaran tikkoja per taso. Yli jaaneet tikat siirtyvat
            bonuksena seuraavaan tasoon. Lopetus tehdaan tuplalla, ja jos taso
            jaa kesken, peli alkaa alusta.
          </Text>

          {pendingDarts.length > 0 && !isFinished && (
            <Text variant="bodyLarge" style={styles.pendingText}>
              Heitot: {formatTurnSummary(pendingDarts)} ({pendingTotal} p)
            </Text>
          )}

          {advanceMessage && !isFinished && (
            <Text variant="bodyLarge" style={styles.successText}>
              {advanceMessage}
            </Text>
          )}

          {resetReason && !isFinished && (
            <Text variant="bodyLarge" style={styles.failText}>
              {resetReason}
            </Text>
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
                Tikat jaljella
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
                    ]}
                  >
                    {stage.score}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.progressMeta,
                      isCurrent && styles.progressTitleCurrent,
                    ]}
                  >
                    {limitLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>

        <Surface style={styles.inputCard} elevation={1}>
          <DartsKeyboard
            onThrow={handleThrow}
            onUndo={handleUndo}
            onReset={handleReset}
          />
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

          {turns.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Ei viela kirjattuja vuoroja.
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
                      {turn.stageLabel}: {turn.startScore} -&gt; {turn.endScore}
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
                    {turn.won
                      ? "CLEAR"
                      : turn.bust
                      ? "BUST"
                      : `${turn.darts.reduce(
                          (sum, dart) => sum + dart.points,
                          0
                        )} p`}
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
      borderRadius: theme.roundness * 2,
      padding: 16,
      gap: 8,
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
    },
    helperText: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    pendingText: {
      color: theme.colors.primary,
    },
    successText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    failText: {
      color: theme.colors.error,
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
      backgroundColor: theme.colors.background,
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
      backgroundColor: theme.colors.background,
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
    progressMeta: {
      color: theme.colors.onSurfaceVariant,
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
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

import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import type { MD3Theme } from "react-native-paper";

import { useRecentGames, type RecentGame } from "./hooks/useRecentGames";

type FirestoreTimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

const formatNumber = (value: number, fractionDigits = 1) => {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(fractionDigits);
};

const formatInt = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toString();
};

const getDateFromTimestamp = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value) {
    const ts = value as FirestoreTimestampLike;
    if (typeof ts.toDate === "function") return ts.toDate();
    if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  }
  return null;
};

const formatDate = (value: unknown) => {
  const date = getDateFromTimestamp(value);
  if (!date) return "Tuntematon päivä";
  return date.toLocaleDateString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const computeAverage = (points?: number, darts?: number) => {
  if (!points || !darts || darts <= 0) return 0;
  return (points / darts) * 3;
};

type GameCardProps = {
  game: RecentGame;
  theme: MD3Theme;
};

function GameCard({ game, theme }: GameCardProps) {
  const styles = createStyles(theme);
  const average = computeAverage(game.points, game.dartsThrown);

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {formatDate(game.createdAt)}
          </Text>
          <Text variant="titleMedium" style={styles.cardValue}>
            {formatNumber(average, 2)}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.cardHelper}>
          Kolmen tikan keskiarvo
        </Text>

        <Divider style={styles.divider} />

        <View style={styles.row}>
          <Text variant="bodyMedium" style={styles.label}>
            Pisteet
          </Text>
          <Text variant="titleSmall" style={styles.value}>
            {formatInt(game.points ?? 0)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text variant="bodyMedium" style={styles.label}>
            Heitetyt tikat
          </Text>
          <Text variant="titleSmall" style={styles.value}>
            {formatInt(game.dartsThrown ?? 0)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text variant="bodyMedium" style={styles.label}>
            Doubles
          </Text>
          <Text variant="titleSmall" style={styles.value}>
            {formatInt(game.doublesHit ?? 0)} / {formatInt(game.doublesAttempted ?? 0)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text variant="bodyMedium" style={styles.label}>
            Checkout
          </Text>
          <Text variant="titleSmall" style={styles.value}>
            {formatInt(game.checkout ?? 0)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function GameHistoryScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { uid, games, loading, error, refresh } = useRecentGames(40);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <Surface style={styles.stateSurface} elevation={1}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.infoText}>
            Ladataan pelihistoriaa...
          </Text>
        </Surface>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <Surface style={styles.stateSurface} elevation={1}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
          <Button mode="contained" onPress={refresh} style={styles.centerButton}>
            Yritä uudelleen
          </Button>
        </Surface>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.container}
      data={games}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <>
          <Text variant="headlineMedium" style={styles.title}>
            Pelihistoria
          </Text>

          {!uid ? (
            <Card style={styles.noticeCard} mode="contained">
              <Card.Content>
                <Text variant="titleMedium" style={styles.noticeTitle}>
                  Et ole kirjautunut
                </Text>
                <Text variant="bodyMedium" style={styles.noticeText}>
                  Kirjaudu sisään nähdäksesi pelihistorian.
                </Text>
              </Card.Content>
            </Card>
          ) : null}

          {uid && games.length === 0 ? (
            <Card style={styles.noticeCard} mode="contained">
              <Card.Content>
                <Text variant="bodyMedium" style={styles.noticeText}>
                  Ei vielä pelattuja pelejä.
                </Text>
              </Card.Content>
            </Card>
          ) : null}
        </>
      )}
      renderItem={({ item }) => <GameCard game={item} theme={theme} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListFooterComponent={() => (
        <Button mode="outlined" onPress={refresh} style={styles.refreshButton}>
          Päivitä lista
        </Button>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      padding: 16,
      paddingBottom: 32,
    },
    stateSurface: {
      margin: 24,
      padding: 24,
      borderRadius: theme.roundness * 3,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    title: {
      marginBottom: 16,
      color: theme.colors.onBackground,
      fontWeight: "700",
    },
    card: {
      backgroundColor: theme.colors.surface,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    cardTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    cardValue: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    cardHelper: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    label: {
      color: theme.colors.onSurface,
    },
    value: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    divider: {
      marginVertical: 8,
      backgroundColor: theme.colors.outlineVariant,
    },
    separator: {
      height: 12,
    },
    infoText: {
      marginTop: 12,
      textAlign: "center",
      color: theme.colors.onSurface,
    },
    errorText: {
      textAlign: "center",
      marginBottom: 12,
      color: theme.colors.error,
    },
    centerButton: {
      marginTop: 4,
    },
    noticeCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.secondaryContainer,
    },
    noticeTitle: {
      marginBottom: 6,
      color: theme.colors.onSecondaryContainer,
      fontWeight: "700",
    },
    noticeText: {
      color: theme.colors.onSecondaryContainer,
      lineHeight: 20,
    },
    refreshButton: {
      marginTop: 8,
    },
  });

import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MD3Theme } from "react-native-paper";

import { auth, subscribeToAuthChanges } from "../../firebase/Auth";
import {
  createUserStatsIfMissing,
  getLast30DaysInsights,
  getRecentAverages,
  getUserStats,
  Last30DaysInsights,
  RecentAverages,
  UserStats,
} from "../../firebase/Firestore";
import type { RootStackParamList } from "../../types/NavigationType";

const emptyStats: UserStats = {
  totalPoints: 0,
  totalDartsThrown: 0,
  threeDartAverage: 0,
  doublesHit: 0,
  doublesAttempted: 0,
  doublePercentage: 0,
  gamesPlayed: 0,
  bestLegDarts: 0,
  highestCheckout: 0,
};

const emptyAverages: RecentAverages = {
  last10Avg: 0,
  last25Avg: 0,
  last50Avg: 0,
};

const formatNumber = (value: number, fractionDigits = 1) => {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(fractionDigits);
};

const formatInt = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toString();
};

const formatPercent = (value: number, fractionDigits = 1) => {
  return `${formatNumber(value, fractionDigits)}%`;
};

type StatRowProps = {
  label: string;
  value: string;
  helper?: string;
  theme: MD3Theme;
};

function StatRow({ label, value, helper, theme }: StatRowProps) {
  const styles = createStyles(theme);

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text variant="bodyMedium" style={styles.label}>
          {label}
        </Text>
        {helper ? (
          <Text variant="bodySmall" style={styles.helper}>
            {helper}
          </Text>
        ) : null}
      </View>

      <Text variant="titleMedium" style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Stats">>();

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [averages, setAverages] = useState<RecentAverages | null>(null);
  const [insights, setInsights] = useState<Last30DaysInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUid(user?.uid ?? null);
    });

    return unsubscribe;
  }, []);

  const loadStats = useCallback(async () => {
    if (!uid) {
      setStats(emptyStats);
      setAverages(emptyAverages);
      setInsights(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createUserStatsIfMissing(uid);

      const [statsData, averagesData, insightsData] = await Promise.all([
        getUserStats(uid),
        getRecentAverages(uid),
        getLast30DaysInsights(uid),
      ]);

      setStats(statsData);
      setAverages(averagesData);
      setInsights(insightsData);
    } catch (err) {
      setError("Tilastojen haku epäonnistui. Yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [loadStats])
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <Surface style={styles.stateSurface} elevation={1}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.infoText}>
            Ladataan tilastoja...
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
          <Button mode="contained" onPress={loadStats} style={styles.centerButton}>
            Yritä uudelleen
          </Button>
        </Surface>
      </View>
    );
  }

  const currentStats = stats ?? emptyStats;
  const currentAverages = averages ?? emptyAverages;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineMedium" style={styles.title}>
        Omat tilastot
      </Text>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate("GameHistory")}
        style={styles.historyButton}
      >
        Pelihistoria
      </Button>

      {!uid ? (
        <Card style={styles.noticeCard} mode="contained">
          <Card.Content>
            <Text variant="titleMedium" style={styles.noticeTitle}>
              Et ole kirjautunut
            </Text>
            <Text variant="bodyMedium" style={styles.noticeText}>
              Näytetään esimerkkitilastot. Oikeat tilastot tulevat näkyville,
              kun kirjaudut sisään.
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Yleiskatsaus
          </Text>

          <StatRow
            theme={theme}
            label="Kolmen tikan keskiarvo"
            value={formatNumber(currentStats.threeDartAverage, 2)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Pelit"
            value={formatInt(currentStats.gamesPlayed)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Yhteispisteet"
            value={formatInt(currentStats.totalPoints)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Heitetyt tikat"
            value={formatInt(currentStats.totalDartsThrown)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Doubles
          </Text>

          <StatRow
            theme={theme}
            label="Osumat"
            value={formatInt(currentStats.doublesHit)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Yritykset"
            value={formatInt(currentStats.doublesAttempted)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Osumaprosentti"
            value={formatPercent(currentStats.doublePercentage, 1)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Ennätykset
          </Text>

          <StatRow
            theme={theme}
            label="Paras legi (tikkaa)"
            value={formatInt(currentStats.bestLegDarts)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Korkein checkout"
            value={formatInt(currentStats.highestCheckout)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Viimeisimmät keskiarvot
          </Text>

          <StatRow
            theme={theme}
            label="Viimeiset 10 peliä"
            value={formatNumber(currentAverages.last10Avg, 2)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Viimeiset 25 peliä"
            value={formatNumber(currentAverages.last25Avg, 2)}
          />
          <Divider style={styles.divider} />

          <StatRow
            theme={theme}
            label="Viimeiset 50 peliä"
            value={formatNumber(currentAverages.last50Avg, 2)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Viimeiset 30 päivää
          </Text>

          {insights ? (
            <>
              <StatRow
                theme={theme}
                label="Keskiarvo"
                value={formatNumber(insights.avg, 2)}
              />
              <Divider style={styles.divider} />

              <StatRow
                theme={theme}
                label="Doubles %"
                value={formatPercent(insights.doublePct, 1)}
              />
              <Divider style={styles.divider} />

              <StatRow
                theme={theme}
                label="Pelit"
                value={formatInt(insights.games)}
              />
              <Divider style={styles.divider} />

              <StatRow
                theme={theme}
                label="Trendi"
                value={formatNumber(insights.trend, 2)}
                helper="Positiivinen = paranee"
              />
            </>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Ei tarpeeksi dataa.
            </Text>
          )}
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={loadStats} style={styles.refreshButton}>
        Päivitä tilastot
      </Button>
    </ScrollView>
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
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
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
    cardTitle: {
      marginBottom: 12,
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    rowText: {
      flex: 1,
      paddingRight: 12,
    },
    label: {
      color: theme.colors.onSurface,
    },
    helper: {
      marginTop: 4,
      color: theme.colors.onSurfaceVariant,
    },
    value: {
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    divider: {
      marginVertical: 2,
      backgroundColor: theme.colors.outlineVariant,
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
    emptyText: {
      color: theme.colors.onSurfaceVariant,
    },
    refreshButton: {
      marginTop: 4,
    },
    historyButton: {
      marginBottom: 16,
    },
  });

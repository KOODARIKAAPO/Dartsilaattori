import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Divider, Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

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
};

function StatRow({ label, value, helper }: StatRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.infoText}>Ladataan tilastoja...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadStats} style={styles.centerButton}>
          Yrita uudelleen
        </Button>
      </View>
    );
  }

  const currentStats = stats ?? emptyStats;
  const currentAverages = averages ?? emptyAverages;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Omat tilastot</Text>
      {!uid ? (
        <Card style={styles.noticeCard}>
          <Card.Content>
            <Text style={styles.noticeTitle}>Et ole kirjautunut</Text>
            <Text style={styles.noticeText}>
              Naytetaan esimerkkitilastot. Oikeat tilastot tulevat
              nakyville, kun kirjaudut sisaan.
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Yleiskatsaus</Text>
          <StatRow
            label="Kolmen tikan keskiarvo"
            value={formatNumber(currentStats.threeDartAverage, 2)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Pelit"
            value={formatInt(currentStats.gamesPlayed)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Yhteispisteet"
            value={formatInt(currentStats.totalPoints)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Heitetyt tikat"
            value={formatInt(currentStats.totalDartsThrown)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Doubles</Text>
          <StatRow
            label="Osumat"
            value={formatInt(currentStats.doublesHit)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Yritykset"
            value={formatInt(currentStats.doublesAttempted)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Osumaprosentti"
            value={formatPercent(currentStats.doublePercentage, 1)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Ennatykset</Text>
          <StatRow
            label="Paras legi (tikkaa)"
            value={formatInt(currentStats.bestLegDarts)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Korkein checkout"
            value={formatInt(currentStats.highestCheckout)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Viimeisimmat keskiarvot</Text>
          <StatRow
            label="Viimeiset 10 pelia"
            value={formatNumber(currentAverages.last10Avg, 2)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Viimeiset 25 pelia"
            value={formatNumber(currentAverages.last25Avg, 2)}
          />
          <Divider style={styles.divider} />
          <StatRow
            label="Viimeiset 50 pelia"
            value={formatNumber(currentAverages.last50Avg, 2)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Viimeiset 30 paivaa</Text>
          {insights ? (
            <>
              <StatRow
                label="Keskiarvo"
                value={formatNumber(insights.avg, 2)}
              />
              <Divider style={styles.divider} />
              <StatRow
                label="Doubles %"
                value={formatPercent(insights.doublePct, 1)}
              />
              <Divider style={styles.divider} />
              <StatRow
                label="Pelit"
                value={formatInt(insights.games)}
              />
              <Divider style={styles.divider} />
              <StatRow
                label="Trendi"
                value={formatNumber(insights.trend, 2)}
                helper="positiivinen = paranee"
              />
            </>
          ) : (
            <Text style={styles.emptyText}>Ei tarpeeksi dataa.</Text>
          )}
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={loadStats} style={styles.refreshButton}>
        Paivita tilastot
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    marginBottom: 16,
  },
  noticeCard: {
    marginBottom: 16,
    backgroundColor: "#fef9c3",
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: "#4b5563",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 14,
    color: "#4b5563",
  },
  helper: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    marginVertical: 2,
  },
  infoText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 8,
  },
  errorText: {
    textAlign: "center",
    color: "#b91c1c",
    marginBottom: 12,
  },
  centerButton: {
    marginTop: 4,
  },
  emptyText: {
    color: "#6b7280",
  },
  refreshButton: {
    marginTop: 4,
  },
});

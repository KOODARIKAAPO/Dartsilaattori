import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Card, ActivityIndicator, Button, useTheme } from "react-native-paper";
import { Svg, Polyline, Circle, Line } from "react-native-svg";
import { auth, subscribeToAuthChanges } from "../../firebase/Auth";
import { getRecentGames, GameInput } from "../../firebase/Firestore";

const MAX_GAMES = 30

export default function ProgressScreen() {
  const theme = useTheme()
  const styles = createStyles(theme)

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [games, setGames] = useState<GameInput[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUid(user?.uid ?? null)
    });

    return unsubscribe;
  }, []);

  const loadGames = useCallback(async () => {
    if (!uid) {
      setGames([])
      setError("Kirjaudu sisään nähdäksesi kehityskaavion.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const recentGames = await getRecentGames(uid, MAX_GAMES)
      setGames(recentGames as GameInput[])
    } catch (err) {
      setError("Virhe pelihistorian haussa. Yritä uudelleen.")
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    void loadGames()
  }, [loadGames])

  const gameAverages = games
    .slice()
    .reverse()
    .map((game) => (game.dartsThrown > 0 ? (game.points / game.dartsThrown) * 3 : 0))

  const maxAvg = Math.max(100, ...gameAverages, 1)

  const hasData = gameAverages.length > 0

  const chartHeight = 140
  const chartWidth = 100

  const chartPoints = gameAverages.map((avg, idx) => {
    const x = gameAverages.length > 1 ? (idx / (gameAverages.length - 1)) * chartWidth : chartWidth / 2
    const normalized = maxAvg > 0 ? avg / maxAvg : 0
    const y = chartHeight - normalized * chartHeight
    return { x, y, value: avg }
  });

  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(" ")

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kehitys</Text>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.infoText}>Ladataan peli- ja tilastotietoja...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadGames} style={styles.refreshButton}>
            Yritä uudelleen
          </Button>
        </View>
      ) : (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text style={styles.cardTitle}>Viimeisen 30 pelin keskiarvon kehitys</Text>

            {hasData ? (
              <View>
                <View style={styles.chartArea}>
                  <Svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={styles.chartSvg}>
                    <Line
                      x1="0"
                      y1={chartHeight * 0.25}
                      x2={chartWidth}
                      y2={chartHeight * 0.25}
                      stroke={theme.colors.outlineVariant}
                      strokeWidth="0.4"
                    />
                    <Line
                      x1="0"
                      y1={chartHeight * 0.5}
                      x2={chartWidth}
                      y2={chartHeight * 0.5}
                      stroke={theme.colors.outlineVariant}
                      strokeWidth="0.4"
                    />
                    <Line
                      x1="0"
                      y1={chartHeight * 0.75}
                      x2={chartWidth}
                      y2={chartHeight * 0.75}
                      stroke={theme.colors.outlineVariant}
                      strokeWidth="0.4"
                    />
                    <Polyline
                      points={polylinePoints}
                      fill="none"
                      stroke={theme.colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {chartPoints.map((point, idx) => (
                      <Circle
                        key={`${idx}-${point.y}`}
                        cx={point.x}
                        cy={point.y}
                        r="2.5"
                        fill={theme.colors.primary}
                      />
                    ))}
                  </Svg>
                </View>
                <View style={styles.chartLabelRow}>
                  <Text style={styles.smallText}>Vanhin</Text>
                  <Text style={styles.smallText}>Uusin</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>Nykyinen: {gameAverages.slice(-1)[0].toFixed(1)}</Text>
                  <Text style={styles.statsText}>Suurin: {Math.max(...gameAverages).toFixed(1)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>Ei vielä riittävästi pelihistoriaa kaavion piirtämiseen.</Text>
            )}
          </Card.Content>
        </Card>
      )}

      <Button mode="outlined" onPress={loadGames} style={styles.refreshButton}>
        Päivitä
      </Button>
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      padding: 16,
      paddingBottom: 32,
    },
    title: {
      marginBottom: 12,
      color: theme.colors.onBackground,
      fontSize: 22,
      fontWeight: "700",
    },
    card: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    cardTitle: {
      marginBottom: 12,
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "700",
    },
    stateBox: {
      marginBottom: 16,
      padding: 16,
      borderRadius: theme.roundness ?? 8,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
    },
    infoText: {
      marginTop: 8,
      textAlign: "center",
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
      marginBottom: 8,
    },
    refreshButton: {
      marginTop: 8,
    },
    chartArea: {
      height: 180,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 8,
      backgroundColor: theme.colors.background,
      overflow: "hidden",
      marginBottom: 8,
    },
    chartGrid: {
      ...StyleSheet.absoluteFillObject,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 0,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 0,
      borderRightWidth: 0,
    },
    chartSvg: {
      width: "100%",
      height: "100%",
    },
    chartLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    smallText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statsText: {
      color: theme.colors.onSurface,
      fontSize: 12,
      fontWeight: "700",
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
    },
  });

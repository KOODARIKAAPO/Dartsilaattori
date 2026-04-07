import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Card, ActivityIndicator, Button, useTheme } from "react-native-paper";
import { Svg, Polyline, Circle, Line, Path, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { auth, subscribeToAuthChanges } from "../../firebase/Auth";
import {subscribeToRecentGames, subscribeToUserStats, GameInput, UserStats,
} from "../../firebase/Firestore";

const MAX_GAMES = 30

type GameRecord = GameInput & { id: string };

export default function ProgressScreen() {
  const theme = useTheme()
  const styles = createStyles(theme)

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [games, setGames] = useState<GameRecord[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [gamesLoading, setGamesLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loading = gamesLoading || statsLoading

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUid(user?.uid ?? null)
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) {
      setGames([])
      setStats(null)
      setError("Kirjaudu sisään nähdäksesi kehityskaavion.")
      setGamesLoading(false)
      setStatsLoading(false)
      return undefined;
    }

    setGamesLoading(true)
    setStatsLoading(true)
    setError(null)

    const unsubscribe = subscribeToRecentGames(
      uid,
      MAX_GAMES,
      (recentGames) => {
        setGames(recentGames);
        setGamesLoading(false);
      },
      () => {
        setError("Virhe pelihistorian haussa. Yritä uudelleen.");
        setGamesLoading(false);
      }
    );

    const unsubscribeStats = subscribeToUserStats(
      uid,
      (nextStats) => {
        setStats(nextStats);
        setStatsLoading(false);
      },
      () => {
        setError("Virhe tilastojen haussa. Yritä uudelleen.");
        setStatsLoading(false);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeStats();
    };
  }, [uid]);

  const gameAverages = useMemo(() => {
    return games
      .slice()
      .reverse()
      .map((game) =>
        game.dartsThrown > 0 ? (game.points / game.dartsThrown) * 3 : 0
      );
  }, [games]);

  const doublesEfficiency = useMemo(() => {
    let hits = 0
    let attempts = 0
    return games
      .slice()
      .reverse()
      .map((game) => {
        hits += game.doublesHit ?? 0
        attempts += game.doublesAttempted ?? 0
        return attempts > 0 ? (hits / attempts) * 100 : 0
      })
  }, [games])

  const maxAvgValue =
    gameAverages.length > 0 ? Math.max(...gameAverages) : 0
  const minAvgValue =
    gameAverages.length > 0 ? Math.min(...gameAverages) : 0
  const maxAvg = Math.max(40, maxAvgValue, 1)
  const avgValue =
    gameAverages.length > 0
      ? gameAverages.reduce((sum, v) => sum + v, 0) / gameAverages.length
      : 0

  const hasData = gameAverages.length > 0

  const chartHeight = 220
  const chartWidth = 220
  const doublesChartHeight = 180
  const doublesChartWidth = 220

  const chartPoints = useMemo(() => {
    return gameAverages.map((avg, idx) => {
      const x =
        gameAverages.length > 1
          ? (idx / (gameAverages.length - 1)) * chartWidth
          : chartWidth / 2;
      const normalized = maxAvg > 0 ? avg / maxAvg : 0;
      const y = chartHeight - normalized * chartHeight;
      return { x, y, value: avg };
    });
  }, [gameAverages, maxAvg]);

  const polylinePoints = useMemo(
    () => chartPoints.map((p) => `${p.x},${p.y}`).join(" "),
    [chartPoints]
  );
  const lastPoint = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1] : null
  const minPoint = chartPoints.reduce<{ x: number; y: number } | null>(
    (acc, point) => {
      if (!acc || point.y > acc.y) return point;
      return acc;
    },
    null
  )
  const maxPoint = chartPoints.reduce<{ x: number; y: number } | null>(
    (acc, point) => {
      if (!acc || point.y < acc.y) return point;
      return acc;
    },
    null
  )
  const xTickLabels = useMemo(() => {
    const total = gameAverages.length
    if (total <= 1) return [{ label: total.toString(), key: "only" }]
    const mid = Math.round(total / 2)
    return [
      { label: "1", key: "first" },
      { label: mid.toString(), key: "mid" },
      { label: total.toString(), key: "last" },
    ]
  }, [gameAverages.length])

  const tickFractions = [1, 0.75, 0.5, 0.25, 0]
  const tickValues = tickFractions.map((f) => Math.round(maxAvg * f))
  const avgLineY =
    maxAvg > 0 ? chartHeight - (avgValue / maxAvg) * chartHeight : chartHeight

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))

  const buildCurvePath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return ""
    if (points.length === 1) {
      const p = points[0]
      return `M ${p.x} ${p.y}`
    }
    const smoothing = 0.2
    return points.reduce((path, point, i, pts) => {
      if (i === 0) {
        return `M ${point.x} ${point.y}`
      }
      const prev = pts[i - 1]
      const next = pts[i + 1] || point
      const dx = next.x - prev.x
      const dy = next.y - prev.y
      const c1x = prev.x + dx * smoothing
      const c1y = prev.y + dy * smoothing
      const c2x = point.x - dx * smoothing
      const c2y = point.y - dy * smoothing
      return `${path} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${point.x} ${point.y}`
    }, "")
  }

  const buildAreaPath = (
    curve: string,
    points: Array<{ x: number; y: number }>,
    height: number
  ) => {
    if (!curve || points.length === 0) return ""
    const last = points[points.length - 1]
    return `${curve} L ${last.x} ${height} L 0 ${height} Z`
  }

  const curvePath = useMemo(() => {
    if (chartPoints.length === 0) return ""
    return buildCurvePath(chartPoints)
  }, [chartPoints])

  const areaPath = useMemo(() => {
    return buildAreaPath(curvePath, chartPoints, chartHeight)
  }, [chartPoints, chartHeight, curvePath])

  const doublesMax = Math.max(0, ...doublesEfficiency)
  const doublesAvg =
    doublesEfficiency.length > 0
      ? doublesEfficiency[doublesEfficiency.length - 1]
      : 0
  const doublesPoints = useMemo(() => {
    return doublesEfficiency.map((pct, idx) => {
      const x =
        doublesEfficiency.length > 1
          ? (idx / (doublesEfficiency.length - 1)) * doublesChartWidth
          : doublesChartWidth / 2
      const normalized = pct / 100
      const y = doublesChartHeight - normalized * doublesChartHeight
      return { x, y, value: pct }
    })
  }, [doublesEfficiency, doublesChartHeight, doublesChartWidth])
  const doublesCurvePath = useMemo(
    () => buildCurvePath(doublesPoints),
    [doublesPoints]
  )
  const doublesAreaPath = useMemo(
    () => buildAreaPath(doublesCurvePath, doublesPoints, doublesChartHeight),
    [doublesCurvePath, doublesPoints, doublesChartHeight]
  )

  const doublesAttempted = stats?.doublesAttempted ?? 0
  const doublesHit = stats?.doublesHit ?? 0
  const doublesMissed = Math.max(0, doublesAttempted - doublesHit)
  const doublePct =
    doublesAttempted > 0 ? doublesHit / doublesAttempted : 0

  const donutSize = 140
  const donutStroke = 14
  const donutRadius = (donutSize - donutStroke) / 2
  const donutCenter = donutSize / 2
  const donutCircumference = 2 * Math.PI * donutRadius
  const hitLength = donutCircumference * doublePct
  const missLength = donutCircumference - hitLength
  const gap = 6
  const hitDash = Math.max(0, hitLength - gap / 2)
  const missDash = Math.max(0, missLength - gap / 2)
  const hitOffset = 0
  const missOffset = -(hitDash + gap)

  const polarToCartesian = (angle: number, radius = donutRadius) => {
    const a = (angle - 90) * (Math.PI / 180)
    return {
      x: donutCenter + radius * Math.cos(a),
      y: donutCenter + radius * Math.sin(a),
    }
  }

  const hitAngle = Math.max(0, Math.min(1, doublePct)) * 360
  const labelRadius = donutRadius * 0.75
  const hitLabelPos = polarToCartesian(-90 + hitAngle / 2, labelRadius);
  const missLabelPos = polarToCartesian(
    -90 + hitAngle + (360 - hitAngle) / 2,
    labelRadius
  );

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
          <Text style={styles.infoText}>Tarkista verkkoyhteys ja yritä uudelleen.</Text>
        </View>
      ) : (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text style={styles.cardTitle}>Viimeisen 30 pelin keskiarvon kehitys</Text>

            {hasData ? (
              <View>
                <View style={styles.chartRow}>
                  <View style={styles.yAxis}>
                    {tickValues.map((value, idx) => (
                      <Text key={`${value}-${idx}`} style={styles.axisText}>
                        {value}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.chartColumn}>
                    <View style={styles.chartArea}>
                      <Svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={styles.chartSvg}>
                        <Defs>
                          <LinearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.35" />
                            <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
                          </LinearGradient>
                        </Defs>
                        <Line
                          x1="0"
                          y1={chartHeight}
                          x2={chartWidth}
                          y2={chartHeight}
                          stroke={theme.colors.outline}
                          strokeWidth="0.8"
                        />
                        <Line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2={chartHeight}
                          stroke={theme.colors.outline}
                          strokeWidth="0.8"
                        />
                        {tickFractions.map((fraction) => {
                          const y = chartHeight - fraction * chartHeight
                          return (
                            <Line
                              key={`grid-${fraction}`}
                              x1="0"
                              y1={y}
                              x2={chartWidth}
                              y2={y}
                              stroke={theme.colors.outlineVariant}
                              strokeWidth="0.6"
                            />
                          )
                        })}
                        {tickFractions.map((fraction, idx) => {
                          const y = chartHeight - fraction * chartHeight
                          const value = tickValues[idx] ?? 0
                          return (
                            <SvgText
                              key={`grid-label-${fraction}`}
                              x={4}
                              y={Math.max(10, y - 4)}
                              fill={theme.colors.outlineVariant}
                              fontSize="9"
                              textAnchor="start"
                            >
                              {value}
                            </SvgText>
                          )
                        })}
                        {areaPath ? (
                          <Path d={areaPath} fill="url(#avgFill)" />
                        ) : null}
                        {curvePath ? (
                          <Path
                            d={curvePath}
                            fill="none"
                            stroke={theme.colors.primary}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        ) : null}
                        <Line
                          x1="0"
                          y1={avgLineY}
                          x2={chartWidth}
                          y2={avgLineY}
                          stroke={theme.colors.secondary}
                          strokeWidth="1"
                          strokeDasharray="4 3"
                        />
                        <SvgText
                          x={chartWidth - 4}
                          y={avgLineY - 4}
                          fill={theme.colors.secondary}
                          fontSize="10"
                          textAnchor="end"
                        >
                          Avg {avgValue.toFixed(1)}
                        </SvgText>
                        {lastPoint ? (
                          <Circle
                            cx={lastPoint.x}
                            cy={lastPoint.y}
                            r="3.5"
                            fill={theme.colors.primary}
                          />
                        ) : null}
                        {maxPoint ? (
                          <Circle
                            cx={maxPoint.x}
                            cy={maxPoint.y}
                            r="3"
                            fill={theme.colors.tertiary}
                          />
                        ) : null}
                        {maxPoint ? (
                          <SvgText
                            x={clamp(maxPoint.x + 6, 4, chartWidth - 2)}
                            y={clamp(maxPoint.y - 6, 10, chartHeight - 4)}
                            fill={theme.colors.tertiary}
                            fontSize="10"
                            fontWeight="600"
                          >
                            Max {maxAvgValue.toFixed(1)}
                          </SvgText>
                        ) : null}
                        {minPoint ? (
                          <Circle
                            cx={minPoint.x}
                            cy={minPoint.y}
                            r="3"
                            fill={theme.colors.error}
                          />
                        ) : null}
                        {minPoint ? (
                          <SvgText
                            x={clamp(minPoint.x + 6, 4, chartWidth - 2)}
                            y={clamp(minPoint.y + 12, 10, chartHeight - 4)}
                            fill={theme.colors.error}
                            fontSize="10"
                            fontWeight="600"
                          >
                            Min {minAvgValue.toFixed(1)}
                          </SvgText>
                        ) : null}
                      </Svg>
                    </View>
                    <View style={styles.axisLabelRow}>
                      {xTickLabels.map((tick) => (
                        <Text key={tick.key} style={styles.smallText}>
                          {tick.label}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.axisTitleRow}>
                      <Text style={styles.axisTitle}>Pelit</Text>
                      <Text style={styles.axisTitle}>Keskiarvo</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>
                    Nykyinen: {gameAverages.slice(-1)[0].toFixed(1)}
                  </Text>
                  <Text style={styles.statsText}>
                    Suurin: {Math.max(...gameAverages).toFixed(1)}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>
                    Keskiarvo: {avgValue.toFixed(1)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>Ei vielä riittävästi pelihistoriaa kaavion piirtämiseen.</Text>
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.cardTitle}>Tupla % viimeiset 30 peliä</Text>
          {doublesEfficiency.length > 0 ? (
            <View>
              <View style={styles.chartRow}>
                <View style={styles.yAxis}>
                  {[100, 75, 50, 25, 0].map((value) => (
                    <Text key={`dbl-${value}`} style={styles.axisText}>
                      {value}
                    </Text>
                  ))}
                </View>
                <View style={styles.chartColumn}>
                  <View style={[styles.chartArea, styles.doublesChartArea]}>
                    <Svg viewBox={`0 0 ${doublesChartWidth} ${doublesChartHeight}`} style={styles.chartSvg}>
                      <Defs>
                        <LinearGradient id="doubleFill" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor={theme.colors.secondary} stopOpacity="0.35" />
                          <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="0" />
                        </LinearGradient>
                      </Defs>
                      {[1, 0.75, 0.5, 0.25, 0].map((fraction) => {
                        const y = doublesChartHeight - fraction * doublesChartHeight
                        return (
                          <Line
                            key={`dbl-grid-${fraction}`}
                            x1="0"
                            y1={y}
                            x2={doublesChartWidth}
                            y2={y}
                            stroke={theme.colors.outlineVariant}
                            strokeWidth="0.6"
                          />
                        )
                      })}
                      {doublesAreaPath ? (
                        <Path d={doublesAreaPath} fill="url(#doubleFill)" />
                      ) : null}
                      {doublesCurvePath ? (
                        <Path
                          d={doublesCurvePath}
                          fill="none"
                          stroke={theme.colors.secondary}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      ) : null}
                      <SvgText
                        x={doublesChartWidth - 4}
                        y={12}
                        fill={theme.colors.secondary}
                        fontSize="10"
                        textAnchor="end"
                      >
                        Nyt {doublesAvg.toFixed(1)}%
                      </SvgText>
                    </Svg>
                  </View>
                  <View style={styles.axisLabelRow}>
                    {xTickLabels.map((tick) => (
                      <Text key={`dbl-${tick.key}`} style={styles.smallText}>
                        {tick.label}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.axisTitleRow}>
                    <Text style={styles.axisTitle}>Pelit</Text>
                    <Text style={styles.axisTitle}>Tuplat %</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                  Nykyinen: {doublesAvg.toFixed(1)}%
                </Text>
                <Text style={styles.statsText}>
                  Suurin: {doublesMax.toFixed(1)}%
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Ei vielä tarpeeksi dataa tuplien kehitykseen.
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.cardTitle}>Tuplien onnistumisprosentti</Text>
          <View style={styles.pieRow}>
            <View style={styles.pieWrapper}>
              <Svg width={donutSize} height={donutSize}>
                <Circle
                  cx={donutCenter}
                  cy={donutCenter}
                  r={donutRadius}
                  stroke={theme.colors.outlineVariant}
                  strokeWidth={donutStroke}
                  fill="none"
                  strokeLinecap="round"
                />
                <Circle
                  cx={donutCenter}
                  cy={donutCenter}
                  r={donutRadius}
                  stroke={theme.colors.primary}
                  strokeWidth={donutStroke}
                  fill="none"
                  strokeDasharray={`${hitDash} ${donutCircumference}`}
                  strokeDashoffset={hitOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  originX={donutCenter}
                  originY={donutCenter}
                />
                <Circle
                  cx={donutCenter}
                  cy={donutCenter}
                  r={donutRadius}
                  stroke={theme.colors.outlineVariant}
                  strokeWidth={donutStroke}
                  fill="none"
                  strokeDasharray={`${missDash} ${donutCircumference}`}
                  strokeDashoffset={missOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  originX={donutCenter}
                  originY={donutCenter}
                />
              </Svg>
              <View style={styles.pieCenter}>
                <Text style={styles.piePercent}>
                  {Math.round(doublePct * 100)}%
                </Text>
                <Text style={styles.pieLabel}>Tuplat</Text>
              </View>
            </View>
            <View style={styles.pieSide}>
              <Text style={styles.statsText}>Osumat: {doublesHit}</Text>
              <Text style={styles.statsText}>Hudit: {doublesMissed}</Text>
              <Text style={styles.statsText}>Yritykset: {doublesAttempted}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Button mode="outlined" disabled style={styles.refreshButton}>
        Päivittyy automaattisesti
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
    chartRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 8,
    },
    chartColumn: {
      flex: 1,
    },
    yAxis: {
      height: 220,
      justifyContent: "space-between",
      alignItems: "flex-end",
      minWidth: 28,
    },
    axisText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
    },
    chartArea: {
      height: 220,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 8,
      backgroundColor: theme.colors.background,
      overflow: "hidden",
    },
    doublesChartArea: {
      height: 180,
    },
    chartSvg: {
      width: "100%",
      height: "100%",
    },
    axisLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
      paddingHorizontal: 0,
    },
    smallText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    axisTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
      paddingHorizontal: 0,
    },
    axisTitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "600",
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
    pieRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    pieWrapper: {
      width: 140,
      height: 140,
      justifyContent: "center",
      alignItems: "center",
    },
    pieCenter: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    pieSide: {
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 6,
      flex: 1,
    },
    piePercent: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    pieLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });

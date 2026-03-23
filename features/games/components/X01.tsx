import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {Button, Text, TextInput, Surface, useTheme} from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useX01Game } from "../hooks/useX01Game";
import { useScoreInput } from "../hooks/useScoreInput";

export function GameScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  const {
    players,
    currentPlayer,
    round,
    turns,
    winnerId,
    isFinished,
    submitPlayerTurn,
    undo,
    reset,
  } = useX01Game({
    startingScore: 501,
    players: [
      { id: "p1", name: "Pelaaja 1" },
      { id: "p2", name: "Pelaaja 2" },
    ],
  });

  const { value, setValue, parsedValue, isValid, clear } = useScoreInput();

  const winner = players.find((player) => player.id === winnerId) ?? null;

  const handleSubmit = () => {
    if (parsedValue === null) return;
    submitPlayerTurn(parsedValue);
    clear();
  };

  return (
    <Surface style={styles.root} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.headerCard} elevation={1}>
          <Text variant="titleMedium" style={styles.label}>
            Kierros
          </Text>
          <Text variant="headlineSmall" style={styles.round}>
            {round}
          </Text>

          {currentPlayer && !isFinished && (
            <>
              <Text variant="titleMedium" style={styles.label}>
                Vuorossa
              </Text>
              <Text variant="headlineMedium" style={styles.currentPlayerName}>
                {currentPlayer.name}
              </Text>
              <Text variant="titleLarge" style={styles.currentPlayerScore}>
                Jäljellä: {currentPlayer.currentScore}
              </Text>
            </>
          )}

          {isFinished && (
            <>
              <Text variant="titleMedium" style={styles.finished}>
                Peli päättyi!
              </Text>
              {winner && (
                <Text variant="headlineSmall" style={styles.winnerText}>
                  Voittaja: {winner.name}
                </Text>
              )}
            </>
          )}
        </Surface>

        <Surface style={styles.playersCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Pelaajat
          </Text>

          <View style={styles.playersList}>
            {players.map((player, index) => {
              const isCurrent =
                currentPlayer != null && currentPlayer.id === player.id;

              return (
                <Surface key={player.id} style={styles.playerItem} elevation={0}>
                  <View style={styles.playerRow}>
                    <View>
                      <Text variant="titleSmall" style={styles.playerName}>
                        {player.name}
                      </Text>
                      <Text variant="bodyMedium" style={styles.playerMeta}>
                        Pelaaja {index + 1}
                      </Text>
                    </View>

                    <View style={styles.playerScoreBox}>
                      <Text variant="titleMedium" style={styles.playerScore}>
                        {player.currentScore}
                      </Text>
                      {isCurrent && !isFinished && (
                        <Text variant="bodySmall" style={styles.currentBadge}>
                          Vuorossa
                        </Text>
                      )}
                    </View>
                  </View>
                </Surface>
              );
            })}
          </View>
        </Surface>

        <Surface style={styles.inputCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Kirjaa vuoro
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              label="Vuoron pisteet"
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              style={styles.input}
              disabled={isFinished}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={!isValid || isFinished}
              style={styles.primaryButton}
            >
              Tallenna
            </Button>
          </View>

          <Text variant="bodySmall" style={styles.helperText}>
            Syötä yhden vuoron kokonaispisteet (0–180).
          </Text>

          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              onPress={undo}
              style={styles.actionButton}
              disabled={turns.length === 0}
            >
              Peru viimeisin
            </Button>

            <Button mode="outlined" onPress={reset} style={styles.actionButton}>
              Resetoi peli
            </Button>
          </View>
        </Surface>

        <View style={styles.turnsHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Vuorohistoria
          </Text>
        </View>

        <View style={styles.turnsList}>
          {turns.length === 0 && (
            <Text variant="bodyMedium" style={styles.muted}>
              Ei vielä vuoroja.
            </Text>
          )}

          {turns.map((turn, index) => (
            <Surface
              key={`${turn.playerId}-${turn.timestamp}-${index}`}
              style={styles.turnItem}
              elevation={1}
            >
              <Text variant="titleSmall" style={styles.turnPlayer}>
                {turn.playerName}
              </Text>

              <Text variant="bodyMedium" style={styles.turnText}>
                Kierros {turn.round}
              </Text>

              <Text variant="bodyMedium" style={styles.turnText}>
                {turn.previousScore} - {turn.points} = {turn.newScore}
              </Text>

              {turn.isBust && (
                <Text variant="bodySmall" style={styles.bustText}>
                  Bust
                </Text>
              )}
            </Surface>
          ))}
        </View>
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
    },
    playersCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    inputCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    round: {
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    currentPlayerName: {
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    currentPlayerScore: {
      color: theme.colors.primary,
    },
    finished: {
      color: theme.colors.primary,
      marginBottom: 6,
    },
    winnerText: {
      color: theme.colors.onSurface,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    playersList: {
      gap: 10,
    },
    playerItem: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 2,
      padding: 12,
    },
    playerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    playerName: {
      color: theme.colors.onSurface,
    },
    playerMeta: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    playerScoreBox: {
      alignItems: "flex-end",
    },
    playerScore: {
      color: theme.colors.onSurface,
    },
    currentBadge: {
      color: theme.colors.primary,
      marginTop: 2,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    primaryButton: {
      alignSelf: "stretch",
      justifyContent: "center",
    },
    helperText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
    },
    turnsHeader: {
      marginTop: 4,
    },
    turnsList: {
      gap: 8,
    },
    turnItem: {
      padding: 12,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
    },
    turnPlayer: {
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    turnText: {
      color: theme.colors.onSurface,
    },
    bustText: {
      marginTop: 6,
      color: theme.colors.error,
    },
    muted: {
      color: theme.colors.onSurfaceVariant,
    },
  });
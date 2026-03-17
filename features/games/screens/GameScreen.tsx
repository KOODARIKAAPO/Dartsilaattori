import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useX01Game } from "../hooks/use501Game";
import DartsKeyboard from "../components/Dartskeyboard";
import { useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


// MatchScreen-komponentti, joka käyttää useX01Game-hookia ja DartsKeyboard-komponenttia. se näyttää nykyisen pelaajan nimen, pistemäärän ja viimeisimmät heitot, sekä renderöi DartsKeyboardin tikkaheitoille. se on responsiivinen ja mukautuu eri näyttökokoihin.
export default function MatchScreen() {
    const { width, height } = useWindowDimensions();
  const game = useX01Game({
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ],
    startingScore: 501,
    doubleOut: true,
  });
// haetaan nykyisen pelaajan tilanne, jotta voidaan näyttää oikea pistemäärä ja tarkistaa voittotilanne.
  const currentState = game.playerStates[game.currentPlayerIndex];
// renderöidään pelinäkymä, jossa yläosassa näytetään nykyinen pelaaja, pistemäärä ja mahdollinen voittaja, ja alaosassa DartsKeyboard tikkaheitoille. käytetään StyleSheetiä tyylittelyyn ja responsiivisuuteen.
  return (
    <SafeAreaView style={styles.container}>
      {/* Yläosa: scoreboard / viimeiset heitot */}
      <View style={[styles.topContainer, { flex: 0.5, padding: width * 0.04 }]}>
        <Text style={[styles.playerText, { fontSize: width * 0.06 }]}>
          Current player: {game.currentPlayer.name}
        </Text>
        <Text style={[styles.scoreText, { fontSize: width * 0.05 }]}>
          Score: {currentState.score}
        </Text>
        
        {game.winnerId && (
          <Text style={{ fontSize: width * 0.05 }}>Winner: {game.winnerId}</Text>
        )}
      </View>

      {/* Alaosa: keyboard */}
      <View style={[styles.keyboardContainer, { flex: 0.5, paddingVertical: height * 0.01 }]}>
        <DartsKeyboard
          onThrow={(value, multiplier) => game.throwDart({ value, multiplier })}
          onUndo={game.undo}
          onReset={game.reset}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topContainer: {
    flex: 1,            // vie yläpuolesta tilan
    padding: 16,
    justifyContent: "center",
  },
  keyboardContainer: {
    flex: 1,            // vie alhaalta puolet ruudusta
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
  },
  playerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 20,
    marginBottom: 8,
  },
});
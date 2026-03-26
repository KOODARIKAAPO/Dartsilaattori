import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";


// kerroin tikkaukselle: single, double, triple
type Multiplier = 1 | 2 | 3;
// propsit DartsKeyboard-komponentille: callbackit tikkaheitoille, undo-toiminnolle ja reset-toiminnolle.
interface Props {
  onThrow: (value: number, multiplier: Multiplier) => void;
  onUndo: () => void;
  onReset?: () => void;

  numbers?: number[];
  showBull?: boolean;
  showMiss?: boolean;
  showReset?: boolean;
}

const { width, height } = Dimensions.get("window");

// 6 nappia per rivi → responsiivinen koko
const BUTTON_SIZE = width / 6 - 10;
// DartsKeyboard-komponentti, joka renderöi numeronapit 1-20, bullseye-napit ja miss-napin, sekä action-napit double, triple, undo ja reset. se käyttää local statea pitämään kirjaa valitusta kertoimesta (single/double/triple) ja kutsuu propsina annettuja callbackeja tikkaheitoille ja muille toiminnoille.
export default function DartsKeyboard({
  onThrow,
  onUndo,
  onReset,
  numbers = Array.from({ length: 20 }, (_, i) => i + 1),
  showBull = true,
  showMiss = true,
  showReset = true,
}: Props) {
  const [multiplier, setMultiplier] = useState<Multiplier>(1);

  const handlePress = (num: number) => {
    onThrow(num, multiplier);
    setMultiplier(1);
  };

  const handleBull = (isInner: boolean) => {
    const value = isInner ? 25 : 25;

    // inner bull = 50 → kerroin 2
    const multi = isInner ? 2 : 1;

    onThrow(value, multi);
    setMultiplier(1);
  };
// renderöidään numeronapit, bullseye-napit ja miss-nappi, sekä action-napit. käytetään StyleSheetiä tyylittelyyn.
  return (
    <View style={styles.container}>
      {/* NUMEROT */}
      <View style={styles.grid}>
        {numbers.map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.button}
            onPress={() => handlePress(num)}
          >
            <Text style={styles.buttonText}>{num}</Text>
          </TouchableOpacity>
        ))}

        {/* OUTER BULL */}
        {showBull && (
      <>
        <TouchableOpacity
         style={[styles.button, styles.bullOuter]}
          onPress={() => handleBull(false)}
       >
         <Text style={styles.buttonText}>25</Text>
       </TouchableOpacity>

       <TouchableOpacity
         style={[styles.button, styles.bullInner]}
         onPress={() => handleBull(true)}
       >
         <Text style={styles.buttonText}>BULL</Text>
       </TouchableOpacity>
    </>
    )}

        {/* MISS */}
{showMiss && (
  <TouchableOpacity
    style={[styles.button, styles.miss]}
    onPress={() => handlePress(0)}
  >
    <Text style={styles.buttonText}>MISS</Text>
  </TouchableOpacity>
)}

      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            multiplier === 2 && styles.activeDouble,
          ]}
          onPress={() => setMultiplier(2)}
        >
          <Text style={styles.actionText}>DOUBLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            multiplier === 3 && styles.activeTriple,
          ]}
          onPress={() => setMultiplier(3)}
        >
          <Text style={styles.actionText}>TRIPLE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onUndo}>
          <Text style={styles.actionText}>UNDO</Text>
        </TouchableOpacity>

        {showReset && onReset && (
         <TouchableOpacity style={styles.actionButton} onPress={onReset}>
          <Text style={styles.actionText}>RESET</Text>
         </TouchableOpacity>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    margin: 4,
    backgroundColor: "#2c2c2c",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  bullOuter: {
    backgroundColor: "#1e88e5",
  },

  bullInner: {
    backgroundColor: "#d32f2f",
  },
  miss: {
  backgroundColor: "#757575",
},

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 5,
  },

  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    backgroundColor: "#444",
    borderRadius: 10,
    alignItems: "center",
  },

  actionText: {
    color: "white",
    fontWeight: "bold",
  },

  activeDouble: {
    backgroundColor: "#43a047",
  },

  activeTriple: {
    backgroundColor: "#e53935",
  },
});
import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";


// kerroin tikkaukselle: single, double, triple
type Multiplier = 1 | 2 | 3;
// propsit DartsKeyboard-komponentille: callbackit tikkaheitoille, undo-toiminnolle ja reset-toiminnolle.
interface Props {
  onThrow: (value: number, multiplier: Multiplier) => void;
  onUndo: () => void;
  onReset?: () => void;
  disabled?: boolean;

  numbers?: number[];
  showBull?: boolean;
  showMiss?: boolean;
  showReset?: boolean;
  inputPreview?: number[];
}

const { width } = Dimensions.get("window");

// 6 nappia per rivi → responsiivinen koko
const BUTTON_SIZE = width / 7 - 8;
// DartsKeyboard-komponentti, joka renderöi numeronapit 1-20, bullseye-napit ja miss-napin, sekä action-napit double, triple, undo ja reset. se käyttää local statea pitämään kirjaa valitusta kertoimesta (single/double/triple) ja kutsuu propsina annettuja callbackeja tikkaheitoille ja muille toiminnoille.
export default function DartsKeyboard({
  onThrow,
  onUndo,
  onReset,
  disabled = false,
  numbers = Array.from({ length: 20 }, (_, i) => i + 1),
  showBull = true,
  showMiss = true,
  showReset = true,
  inputPreview,
}: Props) {
  const isDisabled = Boolean(disabled);
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const [localPreview, setLocalPreview] = useState<number[]>([]);

  const preview = inputPreview ?? localPreview;
  const previewTotal = useMemo(
    () => preview.reduce((sum, value) => sum + value, 0),
    [preview]
  );

  const pushPreview = (value: number) => {
    if (inputPreview) return;
    setLocalPreview((prev) => {
      const next = [...prev, value];
      return next.length >= 3 ? [] : next;
    });
  };

  const handlePress = (num: number) => {
    if (isDisabled) return;
    const value = num * multiplier;
    onThrow(num, multiplier);
    pushPreview(value);
    setMultiplier(1);
  };

  const handleBull = (isInner: boolean) => {
    if (isDisabled) return;
    const value = isInner ? 25 : 25;

    // inner bull = 50 → kerroin 2
    const multi = isInner ? 2 : 1;

    onThrow(value, multi);
    pushPreview(value * multi);
    setMultiplier(1);
  };
  const handleUndoPress = () => {
    if (isDisabled) return;
    onUndo();
    if (!inputPreview) {
      setLocalPreview((prev) => prev.slice(0, -1));
    }
  };

  const handleResetPress = () => {
    if (isDisabled) return;
    onReset?.();
    if (!inputPreview) {
      setLocalPreview([]);
    }
  };
// renderöidään numeronapit, bullseye-napit ja miss-nappi, sekä action-napit. käytetään StyleSheetiä tyylittelyyn.
  return (
    <View style={styles.container}>
      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>Heitot</Text>
        <Text style={styles.previewValue}>
          {preview.length > 0 ? preview.join(" + ") : "—"}
        </Text>
        <Text style={styles.previewTotal}>Yht: {previewTotal}</Text>
      </View>
      {/* NUMEROT */}
      <View style={styles.grid}>
        {numbers.map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.numberButton,
              isDisabled && styles.buttonDisabled,
            ]}
            onPress={() => handlePress(num)}
            disabled={isDisabled}
          >
            <Text style={styles.buttonText}>{num}</Text>
          </TouchableOpacity>
        ))}

        {/* OUTER BULL */}
        {showBull && (
      <>
        <TouchableOpacity
         style={[
           styles.numberButton,
           styles.bullOuter,
           isDisabled && styles.buttonDisabled,
         ]}
          onPress={() => handleBull(false)}
          disabled={isDisabled}
       >
         <Text style={styles.buttonText}>25</Text>
       </TouchableOpacity>

       <TouchableOpacity
         style={[
           styles.numberButton,
           styles.bullInner,
           isDisabled && styles.buttonDisabled,
         ]}
         onPress={() => handleBull(true)}
         disabled={isDisabled}
       >
         <Text style={styles.buttonText}>BULL</Text>
       </TouchableOpacity>
    </>
    )}

        {/* MISS */}
{showMiss && (
  <TouchableOpacity
    style={[
      styles.numberButton,
      styles.miss,
      isDisabled && styles.buttonDisabled,
    ]}
    onPress={() => handlePress(0)}
    disabled={isDisabled}
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
            isDisabled && styles.buttonDisabled,
          ]}
          onPress={() => setMultiplier(2)}
          disabled={isDisabled}
        >
          <Text style={styles.actionText}>DOUBLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            multiplier === 3 && styles.activeTriple,
            isDisabled && styles.buttonDisabled,
          ]}
          onPress={() => setMultiplier(3)}
          disabled={isDisabled}
        >
          <Text style={styles.actionText}>TRIPLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isDisabled && styles.buttonDisabled,
          ]}
          onPress={handleUndoPress}
          disabled={isDisabled}
        >
          <Text style={styles.actionText}>UNDO</Text>
        </TouchableOpacity>

        {showReset && onReset && (
         <TouchableOpacity
           style={[
             styles.actionButton,
             isDisabled && styles.buttonDisabled,
           ]}
           onPress={handleResetPress}
           disabled={isDisabled}
         >
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
  previewBox: {
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  previewLabel: {
    color: "#9c9c9c",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  previewValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  previewTotal: {
    color: "#9c9c9c",
    fontSize: 10,
    marginTop: 1,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  numberButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    margin: 4,
    backgroundColor: "#1f1f1f",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 1,
    borderColor: "#333",
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  bullOuter: {
    backgroundColor: "#1b5fc2",
    borderColor: "#2e75e8",
  },

  bullInner: {
    backgroundColor: "#b71c1c",
    borderColor: "#e53935",
  },
  miss: {
  backgroundColor: "#3a3a3a",
  borderColor: "#4a4a4a",
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
    backgroundColor: "#2a2a2a",
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#383838",
  },

  actionText: {
    color: "white",
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },

  activeDouble: {
    backgroundColor: "#43a047",
  },

  activeTriple: {
    backgroundColor: "#e53935",
  },
});

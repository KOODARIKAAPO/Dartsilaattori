import React, { useState } from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { useBothKeyboards } from "../hooks/useBothKeyboards";

import DartsKeyboard from "./Dartskeyboard";
import Numpad from "./NumPad";

interface Props {
  onThrow: (value: number, multiplier: 1 | 2 | 3) => void;
  onUndo: () => void;
  onReset?: () => void;
  disabled?: boolean;
  inputPreview?: any;
  onSubmitTurn: (score: number) => void;
}

export const BothKeyboards = (props: Props) => {
  const { type, toggle } = useBothKeyboards("dartboard");

  const [value, setValue] = useState("");

  const handleNumberPress = (num: number) => {
    setValue(prev => prev + num.toString());
  };

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleEnter = () => {
  const score = Number(value);
  if (Number.isNaN(score)) return;

  props.onSubmitTurn(score);
  setValue("");
};

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.toggle} onPress={toggle}>
        <Text style={styles.toggleText}>
          {type === "dartboard" ? "NUM" : "STD"}
        </Text>
      </Pressable>

      {type === "dartboard" ? (
        <DartsKeyboard {...props} />
      ) : (
        <View>

          <Numpad
            value={value}
            onNumberPress={handleNumberPress}
            onBackspace={handleBackspace}
            onEnter={handleEnter}
          />

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 8,
  },
  toggle: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  input: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },

  enter: {
    marginTop: 10,
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  enterText: {
    color: "white",
    fontWeight: "700",
  },
});

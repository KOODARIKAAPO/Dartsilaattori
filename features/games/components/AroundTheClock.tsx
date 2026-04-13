import React from "react";
import { View, Button, Text } from "react-native";

interface Props {
  onThrow: (number: number | "bull", segment: any) => void;
}

export const DartboardInput = ({ onThrow }: Props) => {
  return (
    <View>
      <Text>Heitä tikka:</Text>

      {[...Array(20)].map((_, i) => (
        <View key={i} style={{ flexDirection: "row", margin: 4 }}>
          <Button title={`${i + 1} S`} onPress={() => onThrow(i + 1, "single")} />
          <Button title="D" onPress={() => onThrow(i + 1, "double")} />
          <Button title="T" onPress={() => onThrow(i + 1, "triple")} />
        </View>
      ))}

      <Button title="Outer Bull" onPress={() => onThrow("bull", "outerBull")} />
      <Button title="Bullseye" onPress={() => onThrow("bull", "bull")} />
      <Button title="Miss" onPress={() => onThrow(0, "miss")} />
    </View>
  );
};
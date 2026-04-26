import { useState } from "react";

export type KeyboardType = "dartboard" | "quick";

export function useBothKeyboards(initial: KeyboardType = "dartboard") {
  const [type, setType] = useState<KeyboardType>(initial);

  const toggle = () => {
    setType(prev => (prev === "dartboard" ? "quick" : "dartboard"));
  };

  return {
    type,
    isDartboard: type === "dartboard",
    isQuick: type === "quick",
    toggle,
    setType,
  };
}
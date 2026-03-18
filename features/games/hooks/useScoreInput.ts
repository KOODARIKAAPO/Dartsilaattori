import { useMemo, useState } from "react";

export function useScoreInput() {
  const [value, setValue] = useState("");

  const parsedValue = useMemo(() => {
    if (value.trim() === "") return null;

    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) return null;

    return num;
  }, [value]);

  const clear = () => setValue("");

  return {
    value,
    setValue,
    parsedValue,
    isValid: parsedValue !== null,
    clear,
  };
}
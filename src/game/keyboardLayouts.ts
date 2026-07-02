export interface KeyboardLayout {
  rows: string[][];
}

const es: KeyboardLayout = {
  rows: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Z", "X", "C", "V", "B", "N", "M"], // backspace appended in the component
  ],
};

const en: KeyboardLayout = {
  rows: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ],
};

const LAYOUTS: Record<string, KeyboardLayout> = { es, en };

export function getKeyboardLayout(lang: string): KeyboardLayout {
  return LAYOUTS[lang] ?? en;
}
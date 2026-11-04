// « 0 nul », « 1 victoire », « 3 victoires » (en français, 0 et 1 restent au singulier)
export function count(n: number, word: string): string {
  return `${n} ${word}${n >= 2 ? "s" : ""}`;
}

import { describe, expect, it } from "vitest";
import { GLOSSARY, MAGIC_PHRASES, TRUE_OR_FALSE, verdict } from "./basics";

describe("contenu de « Tu comprends rien au foot ? »", () => {
  it("donne une explication pour chaque Vrai ou faux, avec un peu des deux réponses", () => {
    expect(TRUE_OR_FALSE.every((q) => q.explanation.length > 20)).toBe(true);
    expect(TRUE_OR_FALSE.some((q) => q.answer)).toBe(true);
    expect(TRUE_OR_FALSE.some((q) => !q.answer)).toBe(true);
  });

  it("n'a pas de doublon dans le dico ni dans les phrases magiques", () => {
    expect(new Set(GLOSSARY.map((e) => e.term)).size).toBe(GLOSSARY.length);
    expect(new Set(MAGIC_PHRASES.map((p) => p.quote)).size).toBe(MAGIC_PHRASES.length);
  });
});

describe("verdict", () => {
  it("félicite un sans-faute", () => {
    expect(verdict(5, 5)).toContain("Sans faute");
  });

  it("encourage toujours, même à 0", () => {
    expect(verdict(4, 5)).toContain("Presque parfait");
    expect(verdict(3, 5)).toContain("Pas mal");
    expect(verdict(0, 5)).toContain("retente ta chance");
  });
});

import { describe, expect, it } from "vitest";
import { publicUrl } from "./share";

describe("publicUrl (l'adresse mise dans le QR code)", () => {
  it("garde l'adresse publique une fois l'app en ligne", () => {
    expect(publicUrl("kick-time.vercel.app", "https", "192.168.1.20")).toEqual({ url: "https://kick-time.vercel.app", local: false });
  });

  it("utilise https par défaut si le protocole est inconnu", () => {
    expect(publicUrl("kick-time.vercel.app", null, null).url).toBe("https://kick-time.vercel.app");
  });

  it("remplace « localhost » par l'adresse du PC sur le wifi (sinon le téléphone ne trouverait rien)", () => {
    expect(publicUrl("localhost:3000", "http", "192.168.188.199")).toEqual({ url: "http://192.168.188.199:3000", local: true });
  });

  it("reste en local sans adresse wifi connue", () => {
    expect(publicUrl("localhost:3000", "http", null)).toEqual({ url: "http://localhost:3000", local: true });
  });

  it("reconnaît une page déjà ouverte avec l'adresse wifi du PC", () => {
    expect(publicUrl("192.168.188.199:3000", "http", null)).toEqual({ url: "http://192.168.188.199:3000", local: true });
  });
});

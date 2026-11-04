// Calcule l'adresse à mettre dans le QR code de la page /qr.

// Ce que le QR code peut ouvrir directement.
export const QR_TARGETS = [
  { key: "accueil", label: "Accueil", path: "/" },
  { key: "equipe", label: "Trouve ton équipe", path: "/mon-equipe" },
  { key: "foot", label: "Tu comprends rien au foot ?", path: "/comprendre-le-foot" },
] as const;

const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/; // l'ordinateur lui-même
const PRIVATE_IP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/; // une adresse du réseau wifi local

// host : l'adresse avec laquelle la page a été ouverte (ex. « kick-time.vercel.app » ou « localhost:3000»).
// lanIp : l'adresse de ce PC sur le wifi, si on la connaît.
// En ligne → on garde l'adresse publique. En local → « localhost » ne marcherait pas sur un téléphone,
// on la remplace par l'adresse du PC sur le wifi (le téléphone doit alors être sur le même wifi).
export function publicUrl(host: string, protocol: string | null, lanIp: string | null): { url: string; local: boolean } {
  if (LOOPBACK.test(host)) {
    const port = host.match(/:(\d+)$/)?.[1] ?? "3000";
    return { url: lanIp ? `http://${lanIp}:${port}` : `http://${host}`, local: true };
  }
  if (PRIVATE_IP.test(host)) return { url: `http://${host}`, local: true };
  return { url: `${protocol ?? "https"}://${host}`, local: false };
}

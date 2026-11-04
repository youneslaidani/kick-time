import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { networkInterfaces } from "node:os";
import QRCode from "qrcode";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import { publicUrl, QR_TARGETS } from "@/lib/share";

export const metadata: Metadata = {
  title: "Scanne-moi · Kick-Time",
  description: "Scanne le QR code pour ouvrir Kick-Time sur ton téléphone.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Page /qr : à projeter pendant la présentation pour que la salle ouvre l'app sur son téléphone.
export default function QrPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 lg:px-8">
      <Suspense fallback={<div className="mx-auto aspect-square w-full max-w-md animate-pulse rounded-[2rem] bg-surface" />}>
        <QrView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function QrView({ searchParams }: { searchParams: SearchParams }) {
  const { cible } = await searchParams;
  const target = QR_TARGETS.find((t) => t.key === cible) ?? QR_TARGETS[0];

  // L'adresse avec laquelle cette page a été ouverte : sur Vercel, c'est l'adresse publique de l'app.
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const { url, local } = publicUrl(host, requestHeaders.get("x-forwarded-proto"), wifiAddress());
  const link = target.path === "/" ? url : `${url}${target.path}`;

  // Niveau de correction « H » : le code reste lisible même avec 30 % caché… ce qui laisse la place au logo.
  const qr = await QRCode.toString(link, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#03140a", light: "#ffffff" },
  });

  return (
    <div className="grid w-full items-center gap-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-[min(85vw,65vh)] lg:max-w-[min(42vw,72vh)]">
        <div className="relative rounded-[2rem] bg-white p-4 shadow-[0_0_90px_rgb(43_255_136/0.35)]">
          {/* le SVG est fabriqué par la bibliothèque qrcode à partir de notre adresse */}
          <div className="aspect-square [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="absolute left-1/2 top-1/2 grid size-[21%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white p-1.5">
            <Logo className="size-full" />
          </div>
        </div>
      </div>

      <div className="text-center lg:text-left">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-accent">📱 Scanne-moi</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-none sm:text-7xl">Kick-Time dans ta poche</h1>
        <p className="mt-4 text-lg text-text/85">Ouvre l&apos;appareil photo de ton téléphone, vise le code… et c&apos;est parti !</p>
        <p className="mt-4 break-all font-display text-2xl font-bold text-accent sm:text-3xl">{link.replace(/^https?:\/\//, "")}</p>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Le QR code ouvre :</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 lg:justify-start">
            {QR_TARGETS.map((t) => (
              <Link
                key={t.key}
                href={t.key === "accueil" ? "/qr" : `/qr?cible=${t.key}`}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  t.key === target.key ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-text"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {local && (
          <p className="mt-6 rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-left text-sm">
            <strong className="text-warn">Mode local :</strong> ce QR code ne marche que pour les téléphones connectés au
            même wifi que ce PC. Une fois l&apos;app en ligne sur Vercel, il pointera tout seul vers la vraie adresse.
          </p>
        )}
      </div>
    </div>
  );
}

// L'adresse de ce PC sur le wifi (ex. 192.168.1.20), pour tester le QR code avant la mise en ligne.
function wifiAddress(): string | null {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal && /^(192\.168|10\.|172\.)/.test(address.address)) return address.address;
    }
  }
  return null;
}

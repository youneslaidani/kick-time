import { cacheLife } from "next/cache";
import { parseAnalysis, simpleAnalysis, type Analysis, type AnalysisContent, type MatchFacts } from "./analysis";

// L'IA dans l'app : Google Gemini, appelé uniquement depuis le serveur (la clé n'est jamais envoyée au navigateur).

// Si un modèle est saturé (erreur 503 « forte demande », vue plusieurs fois pendant nos tests), on essaie le suivant.
// Le modèle « lite » est moins demandé : il répondait encore quand les autres étaient saturés (4/11, 16 h).
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"];

// Les consignes données à l'IA. Chaque règle répond à un problème rencontré ou à un choix du projet (voir DEVLOG).
const SYSTEM_PROMPT = `Tu es le commentateur de Kick-Time, une application qui explique le football aux débutants.
On te donne des chiffres calculés AVANT un match. Écris une analyse d'avant-match.

Règles :
- Français simple, phrases courtes, ton enthousiaste mais neutre. Orthographe et accords soignés.
- Appelle toujours les équipes par leur nom, jamais « l'équipe à domicile » ou « les visiteurs ».
- Utilise UNIQUEMENT les chiffres fournis. N'invente aucun fait : aucun joueur, aucun entraîneur, aucune blessure, aucune histoire.
- Si une donnée vaut null, n'en parle pas.
- Les listes de matchs sont datées et vont du plus récent au plus ancien : respecte cet ordre.
- Sers-toi de la « zone » du classement pour expliquer l'enjeu (se qualifier, éviter la relégation…).
- Aucun pronostic : ne dis pas qui va gagner, ne prédis aucun score, ne parle pas de paris.
- Le lexique explique 2 mots de foot que tu as utilisés et qu'un débutant ne connaît pas (pas « domicile » ni « extérieur »).`;

// La forme exacte de la réponse attendue : Gemini doit renvoyer ce JSON et rien d'autre.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    enjeu: { type: "STRING", description: "L'enjeu du match en une seule phrase" },
    resume: { type: "STRING", description: "2 ou 3 phrases pour comprendre le match" },
    forme_domicile: { type: "STRING", description: "1 phrase sur la forme récente de l'équipe qui reçoit" },
    forme_exterieur: { type: "STRING", description: "1 phrase sur la forme récente de l'équipe qui se déplace" },
    face_a_face: { type: "STRING", description: "1 ou 2 phrases sur les confrontations passées" },
    a_surveiller: { type: "ARRAY", items: { type: "STRING" }, description: "2 ou 3 points à surveiller pendant le match" },
    suspense: { type: "INTEGER", description: "Niveau de suspense de 1 (match déséquilibré) à 5 (très indécis)" },
    suspense_raison: { type: "STRING", description: "Pourquoi ce niveau de suspense, en 1 phrase" },
    lexique: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { mot: { type: "STRING" }, definition: { type: "STRING" } },
        required: ["mot", "definition"],
      },
      description: "2 mots de foot utilisés dans l'analyse, expliqués simplement",
    },
  },
  required: ["enjeu", "resume", "forme_domicile", "forme_exterieur", "face_a_face", "a_surveiller", "suspense", "suspense_raison", "lexique"],
};

// Ce que la page appelle : une analyse IA, ou l'analyse de secours si l'IA ne répond pas.
export async function getAnalysis(facts: MatchFacts): Promise<Analysis> {
  if (!process.env.GEMINI_API_KEY) return simpleAnalysis(facts);
  try {
    return await generateAnalysis(facts);
  } catch (error) {
    console.error(error);
    return simpleAnalysis(facts);
  }
}

// Cache partagé pendant 12 h : 20 téléphones sur le même match = 1 seul appel à Gemini.
// Les chiffres font partie de la clé du cache : s'ils changent (nouveau résultat), l'analyse est réécrite.
async function generateAnalysis(facts: MatchFacts): Promise<Analysis> {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: 12 * 3600, expire: 24 * 3600 });

  for (const model of MODELS) {
    const started = Date.now();
    try {
      const content = await callGemini(model, facts);
      console.log(`Analyse IA du match ${facts.match_id} : ${model} en ${Date.now() - started} ms`);
      return { ...content, source: "ia", model };
    } catch (error) {
      console.warn(`${model} indisponible pour le match ${facts.match_id} : ${(error as Error).message}`);
    }
  }
  throw new Error(`Aucun modèle Gemini n'a répondu pour le match ${facts.match_id}`);
}

async function callGemini(model: string, facts: MatchFacts): Promise<AnalysisContent> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: `Voici les chiffres du match :\n${JSON.stringify(facts, null, 2)}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4, // peu de fantaisie : on veut des phrases fidèles aux chiffres
        thinkingConfig: { thinkingLevel: "low" }, // réflexion courte : réponse en ~6 s au lieu de ~11 s
      },
    }),
    // L'offre gratuite peut être lente aux heures chargées (jusqu'à ~20 s) : au-delà de 35 s, on passe au modèle suivant.
    signal: AbortSignal.timeout(35_000),
  });
  if (!response.ok) throw new Error(`Gemini a répondu ${response.status}`);

  const data = await response.json();
  const text: string =
    data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
  const content = parseAnalysis(text);
  if (!content) throw new Error("réponse mal formée");
  return content;
}

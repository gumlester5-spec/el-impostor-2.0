import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_CLUE, SYSTEM_INSTRUCTION_VOTE } from "../constants";
import { Message, Player, Role } from "../types";

const apiKey = import.meta.env.VITE_API_KEY || "";
console.log("Gemini Service initialized. API Key present:", !!apiKey, "Length:", apiKey.length);
const ai = new GoogleGenAI({ apiKey });
const modelName = 'gemini-2.5-flash';

export const getAiClue = async (
  player: Player,
  secretWord: string,
  history: Message[]
): Promise<string> => {
  const isImpostor = player.role === Role.Impostor;

  if (!apiKey) {
    throw new Error("API Key not found. Please check your .env file.");
  }

  console.log(`Generating clue for ${player.name} (${player.role})...`);

  let prompt = `Juego: Adivinanzas con un Infiltrado.\n`;
  prompt += `Tu Nombre: ${player.name}.\n`;

  const historyText = history.length > 0
    ? history.map(h => `- ${h.playerName} dijo: "${h.text}"`).join("\n")
    : "(Nadie ha hablado aún)";

  if (isImpostor) {
    prompt += `Tu ROL: INFILTRADO (No sabes la palabra secreta).\n`;
    prompt += `OBJETIVO: Que no te descubran. Di una frase vaga que aplique a casi cualquier objeto físico.\n`;
    prompt += `ESTRATEGIA: Lee el historial:\n${historyText}\n`;
    prompt += `Si dicen "es rojo", di "A veces tiene otros colores". Si dicen "es grande", di "Depende del modelo".\n`;
    prompt += `Si eres el primero, di algo seguro como: "Suele estar en casas", "Lo usan muchas personas", "Tiene distintas formas".\n`;
  } else {
    prompt += `Tu ROL: CIUDADANO (Sabes la palabra).\n`;
    prompt += `PALABRA SECRETA: "${secretWord}".\n`;
    prompt += `OBJETIVO: Dar una pista FÍSICA Y REAL sobre la palabra "${secretWord}".\n`;
    prompt += `REGLA DE ORO: DEBES mencionar COLOR, MATERIAL, FORMA o LUGAR.\n`;
    prompt += `PROHIBIDO DECIR: "Es divertido", "Es bonito", "Me gusta", "Es importante".\n`;
    prompt += `EJEMPLOS BUENOS:\n`;
    prompt += `- Si es Pizza: "Tiene queso", "Es redonda", "Se come caliente".\n`;
    prompt += `- Si es Sol: "Es brillante", "Está en el cielo", "Es caliente".\n`;
    prompt += `- Si es Guitarra: "Tiene cuerdas", "Es de madera", "Tiene un hueco".\n`;
    prompt += `Historial previo:\n${historyText}\n`;
  }

  prompt += `Responde con UNA sola frase corta (máximo 8 palabras). Sé natural.`;


  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 100,
    }
  });

  let text = response.text?.trim()
    .replace(/^"|"$/g, '')
    .replace(/^Mi pista es: /i, '')
    .replace(/^Pista: /i, '');

  if (!text) {
    throw new Error("AI returned empty response");
  }

  return text;
};

export const getAiVote = async (
  aiPlayer: Player,
  players: Player[],
  secretWord: string,
  history: Message[]
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not found. Please check your .env file.");
  }

  console.log(`Generating vote for ${aiPlayer.name}...`);

  const validTargets = players.filter(p => p.id !== aiPlayer.id);

  const cluesByPlayer: Record<string, string[]> = {};
  validTargets.forEach(p => cluesByPlayer[p.name] = []);

  history.forEach(msg => {
    const p = validTargets.find(target => target.id === msg.playerId);
    if (p) {
      cluesByPlayer[p.name].push(msg.text);
    }
  });

  let cluesSummary = "";
  validTargets.forEach(p => {
    const clues = cluesByPlayer[p.name];
    const clueString = clues.length > 0 ? clues.map(c => `"${c}"`).join(' y ') : "(No dijo nada)";
    cluesSummary += `Jugador ${p.name}: ${clueString}\n`;
  });

  let prompt = `Estás jugando a "Impostor Secreto". Tu nombre es ${aiPlayer.name}.\n`;
  prompt += `Hay 3 jugadores. Uno es el Impostor (no sabe la palabra secreta). Los otros saben que la palabra es "${secretWord}".\n\n`;

  prompt += `Historial de pistas dadas:\n${cluesSummary}\n`;
  prompt += `----------------\n`;

  if (aiPlayer.role === Role.Impostor) {
    prompt += `TU ROL: IMPOSTOR. (No sabías la palabra, pero ahora sabes que era "${secretWord}").\n`;
    prompt += `TU OBJETIVO: Engañar a los demás votando por un Inocente para que te salves tú.\n`;
    prompt += `ESTRATEGIA: Elige al jugador inocente que haya dado la pista más vaga, extraña o difícil de entender. Si todos dieron buenas pistas, elige uno al azar pero mantén tu coartada.\n`;
  } else {
    prompt += `TU ROL: INOCENTE. (Sabes la palabra "${secretWord}").\n`;
    prompt += `TU OBJETIVO: Descubrir y votar al Impostor.\n`;
    prompt += `CRITERIOS PARA VOTAR:\n`;
    prompt += `1. ¿Alguien dijo algo que NO tiene sentido con "${secretWord}"? (Ej: Dijo "es rojo" y la palabra es "Cielo").\n`;
    prompt += `2. ¿Alguien fue demasiado genérico? (Ej: "Es bonito", "Me gusta"). Eso es sospechoso.\n`;
    prompt += `3. Vota por quien sea más probable que NO sepa la palabra.\n`;
  }

  prompt += `\nResponde SOLAMENTE con el nombre del jugador por el que votas. Ejemplo: "Sandra".`;

  // No try-catch block, let the error propagate
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.1,
      maxOutputTokens: 20,
    }
  });

  const voteText = response.text?.trim() || "";
  console.log(`Voto de AI (${aiPlayer.name}) pensando sobre "${secretWord}": ${voteText}`);

  const votedPlayer = validTargets.find(p =>
    voteText.toLowerCase().includes(p.name.toLowerCase())
  );

  if (votedPlayer) return votedPlayer.id;

  // If no clear vote, throw error or return random? User wants errors.
  // But this is logic error, not API error. I'll stick to random fallback for logic, but API errors will throw.
  console.warn("AI did not return a valid player name, voting random.");
  return validTargets[Math.floor(Math.random() * validTargets.length)].id;
};
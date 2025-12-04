import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_CLUE, SYSTEM_INSTRUCTION_VOTE } from "../constants";
import { Message, Player, Role } from "../types";

// Initialize Gemini Client safely
// We assume process.env.API_KEY is replaced by the environment or available via our polyfill
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });
const modelName = 'gemini-2.5-flash';

// Helper for fallbacks to ensure game flow never breaks
const getFallbackClue = (isImpostor: boolean): string => {
  if (isImpostor) {
    const impostorFallbacks = [
        "Creo que hay de varios colores",
        "Suele estar en interiores",
        "No ocupa mucho espacio",
        "A veces es pesado",
        "Lo he visto en tiendas",
    ];
    return impostorFallbacks[Math.floor(Math.random() * impostorFallbacks.length)];
  } else {
    // Fallbacks para inocentes que suenen a pista real aunque sean inventados por emergencia
    const innocentFallbacks = [
        "Suele tener una forma curva",
        "El material es bastante duro",
        "Lo puedes encontrar en una casa",
        "Tiene un color característico",
        "Se puede sostener con la mano"
    ];
    return innocentFallbacks[Math.floor(Math.random() * innocentFallbacks.length)];
  }
};

export const getAiClue = async (
  player: Player,
  secretWord: string,
  history: Message[]
): Promise<string> => {
  const isImpostor = player.role === Role.Impostor;

  if (!apiKey) {
    console.error("API Key not found");
    return getFallbackClue(isImpostor);
  }

  try {
    // Simplificamos el prompt para reducir errores y forzar respuestas directas
    let prompt = `Juego: Adivinanzas con un Infiltrado.\n`;
    prompt += `Tu Nombre: ${player.name}.\n`;
    
    // Build history text
    const historyText = history.length > 0 
      ? history.map(h => `- ${h.playerName} dijo: "${h.text}"`).join("\n")
      : "(Nadie ha hablado aún)";

    if (isImpostor) {
      // --- IMPOSTOR LOGIC ---
      prompt += `Tu ROL: INFILTRADO (No sabes la palabra secreta).\n`;
      prompt += `OBJETIVO: Que no te descubran. Di una frase vaga que aplique a casi cualquier objeto físico.\n`;
      prompt += `ESTRATEGIA: Lee el historial:\n${historyText}\n`;
      prompt += `Si dicen "es rojo", di "A veces tiene otros colores". Si dicen "es grande", di "Depende del modelo".\n`;
      prompt += `Si eres el primero, di algo seguro como: "Suele estar en casas", "Lo usan muchas personas", "Tiene distintas formas".\n`;
    } else {
      // --- INNOCENT LOGIC ---
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
        // Reducimos las system instructions para dar prioridad al prompt directo
        temperature: 0.8, 
        maxOutputTokens: 100,
      }
    });

    let text = response.text?.trim()
      .replace(/^"|"$/g, '')
      .replace(/^Mi pista es: /i, '')
      .replace(/^Pista: /i, '');
    
    // Validación extra: si la respuesta es muy corta o parece un error, usar fallback
    if (!text || text.length < 3 || text.includes("soy una IA")) {
        return getFallbackClue(isImpostor);
    }

    return text;
  } catch (error) {
    console.warn("Error getting AI clue:", error);
    return getFallbackClue(isImpostor);
  }
};

export const getAiVote = async (
  aiPlayer: Player,
  players: Player[],
  secretWord: string,
  history: Message[]
): Promise<string> => {
  if (!apiKey) {
      // Return random vote if no API key
      const validTargets = players.filter(p => p.id !== aiPlayer.id);
      return validTargets[Math.floor(Math.random() * validTargets.length)].id;
  }

  try {
    const validTargets = players.filter(p => p.id !== aiPlayer.id);
    
    // 1. Agrupar pistas por jugador para que la IA analice el perfil completo de cada uno
    const cluesByPlayer: Record<string, string[]> = {};
    validTargets.forEach(p => cluesByPlayer[p.name] = []);
    
    history.forEach(msg => {
        const p = validTargets.find(target => target.id === msg.playerId);
        if (p) {
            cluesByPlayer[p.name].push(msg.text);
        }
    });

    // 2. Crear resumen de pistas
    let cluesSummary = "";
    validTargets.forEach(p => {
        const clues = cluesByPlayer[p.name];
        // Unir pistas claramente
        const clueString = clues.length > 0 ? clues.map(c => `"${c}"`).join(' y ') : "(No dijo nada)";
        cluesSummary += `Jugador ${p.name}: ${clueString}\n`;
    });

    // 3. Construir Prompt Deductivo
    let prompt = `Estás jugando a "Impostor Secreto". Tu nombre es ${aiPlayer.name}.\n`;
    prompt += `Hay 3 jugadores. Uno es el Impostor (no sabe la palabra secreta). Los otros saben que la palabra es "${secretWord}".\n\n`;
    
    prompt += `Historial de pistas dadas:\n${cluesSummary}\n`;
    prompt += `----------------\n`;

    if (aiPlayer.role === Role.Impostor) {
       // Lógica Impostor: Culpar al inocente más débil
       prompt += `TU ROL: IMPOSTOR. (No sabías la palabra, pero ahora sabes que era "${secretWord}").\n`;
       prompt += `TU OBJETIVO: Engañar a los demás votando por un Inocente para que te salves tú.\n`;
       prompt += `ESTRATEGIA: Elige al jugador inocente que haya dado la pista más vaga, extraña o difícil de entender. Si todos dieron buenas pistas, elige uno al azar pero mantén tu coartada.\n`;
    } else {
       // Lógica Inocente: Detectar contradicciones
       prompt += `TU ROL: INOCENTE. (Sabes la palabra "${secretWord}").\n`;
       prompt += `TU OBJETIVO: Descubrir y votar al Impostor.\n`;
       prompt += `CRITERIOS PARA VOTAR:\n`;
       prompt += `1. ¿Alguien dijo algo que NO tiene sentido con "${secretWord}"? (Ej: Dijo "es rojo" y la palabra es "Cielo").\n`;
       prompt += `2. ¿Alguien fue demasiado genérico? (Ej: "Es bonito", "Me gusta"). Eso es sospechoso.\n`;
       prompt += `3. Vota por quien sea más probable que NO sepa la palabra.\n`;
    }

    prompt += `\nResponde SOLAMENTE con el nombre del jugador por el que votas. Ejemplo: "Sandra".`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.1, // Temperatura baja para maximizar lógica y precisión
        maxOutputTokens: 20,
      }
    });

    const voteText = response.text?.trim() || "";
    console.log(`Voto de AI (${aiPlayer.name}) pensando sobre "${secretWord}": ${voteText}`);

    // Buscar coincidencia de nombre en la respuesta
    const votedPlayer = validTargets.find(p => 
        voteText.toLowerCase().includes(p.name.toLowerCase())
    );

    if (votedPlayer) return votedPlayer.id;

    // Fallback: Votar por el primero disponible si la IA no dio un nombre claro
    return validTargets[0].id;

  } catch (error) {
    console.error("Error getting AI vote:", error);
    const validTargets = players.filter(p => p.id !== aiPlayer.id);
    return validTargets[Math.floor(Math.random() * validTargets.length)].id;
  }
};
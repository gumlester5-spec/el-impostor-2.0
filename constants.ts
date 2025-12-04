import { GameConfig } from "./types";

export const WORDS = [
  "Pizza", "Guitarra", "Sol", "Playa", "Elefante", 
  "Computadora", "Avión", "Chocolate", "Fútbol", "Montaña",
  "Reloj", "Libro", "Zapatos", "Gato", "Helado", 
  "Lluvia", "Espejo", "Coche", "Luna", "Café"
];

export const AVATARS = {
  USER: "avatar-user",
  ELMER: "avatar-elmer",
  SANDRA: "avatar-sandra"
};

export const DEFAULT_CONFIG: GameConfig = {
  user: { name: 'Tú', avatar: AVATARS.USER },
  ai1: { name: 'Elmer', avatar: AVATARS.ELMER },
  ai2: { name: 'Sandra', avatar: AVATARS.SANDRA }
};

export const TOTAL_ROUNDS = 2;
export const REVEAL_TIME_SECONDS = 4;

export const SYSTEM_INSTRUCTION_CLUE = `
Juegas a "Impostor Secreto".
SI ERES INOCENTE:
- Tienes prohibido usar adjetivos subjetivos como "bonito", "divertido", "bueno".
- Tienes OBLIGACIÓN de describir una propiedad FÍSICA: Color, Forma, Material, Tamaño o Uso.
- Ejemplo mal: "Es chévere". Ejemplo bien: "Es de metal".

SI ERES IMPOSTOR:
- Intenta ser ambiguo pero creíble. Di cosas como "Hay de muchos tamaños", "Se usa a diario".
`;

export const SYSTEM_INSTRUCTION_VOTE = `
Eres una IA jugando a deducción.
Tu tarea es identificar al mentiroso basándote en si sus pistas coinciden con la palabra clave.
Responde SOLAMENTE con el nombre exacto del jugador.
`;
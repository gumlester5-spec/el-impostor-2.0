# 🕵️‍♂️ Impostor Secreto (AI Powered)

**Impostor Secreto** es un juego web de deducción social inspirado en *Spyfall* o *Undercover*, donde juegas contra inteligencias artificiales impulsadas por **Google Gemini**.

El objetivo es simple: descubrir quién miente o engañar a todos si el mentiroso eres tú.

![Estado del Proyecto](https://img.shields.io/badge/Estado-Terminado-green)
![Tech Stack](https://img.shields.io/badge/Stack-React_19_+_Tailwind_+_Gemini_API-blue)

## 🎮 ¿Cómo se juega?

El juego consta de una partida rápida entre **3 jugadores**: Tú + 2 Agentes de IA.

### 1. Los Roles
Al inicio, se reparte una carta a cada jugador:
*   **😇 Inocentes (2 jugadores):** Reciben una **Palabra Secreta** (ej. "Pizza"). Su misión es demostrar que saben la palabra sin revelarla explícitamente.
*   **😈 Impostor (1 jugador):** No recibe la palabra. Su misión es fingir que la sabe, deducir el tema basándose en las pistas de los demás y no ser descubierto.

### 2. Fase de Pistas (Interrogatorio)
El juego dura **2 rondas**. En cada turno, los jugadores deben escribir una pista relacionada con la palabra secreta.
*   *Estrategia Inocente:* Dar una pista lo suficientemente clara para los otros inocentes, pero sutil para que el impostor no adivine la palabra.
*   *Estrategia Impostor:* Leer el historial de chat, analizar qué han dicho los demás y decir algo ambiguo que encaje para pasar desapercibido.

### 3. Fase de Votación
Al terminar las rondas, todos votan por quién creen que es el Impostor.
*   Las IAs analizan el chat y votan lógicamente: si detectan contradicciones o pistas sin sentido, votarán por ese jugador.

### 4. Victoria
*   **Ganan los Inocentes:** Si expulsan al Impostor.
*   **Gana el Impostor:** Si logra que expulsen a un inocente o si sobrevive a la votación (empate).

---

## ✨ Características Principales

*   **🧠 IAs Inteligentes:** Los oponentes (Elmer y Sandra) usan `gemini-2.5-flash` para generar pistas coherentes y realizar votaciones deductivas basadas en el historial de la partida.
*   **🎨 Personalización:** Puedes cambiar tu nombre, avatar (subir foto) y también personalizar a las IAs antes de jugar.
*   **⚡ Pistas Físicas:** El sistema obliga a las IAs a dar pistas sobre forma, color o material para evitar respuestas genéricas como "es divertido".
*   **📱 Diseño Responsivo:** Interfaz moderna y animada construida con Tailwind CSS, funcional en móviles y escritorio.

---

## 🛠️ Tecnologías Usadas

*   **Frontend:** React 19, TypeScript.
*   **Estilos:** Tailwind CSS.
*   **Inteligencia Artificial:** Google Gemini API (`@google/genai`).
*   **Build Tool:** Vite (Recomendado para desarrollo local).

---

## 🚀 Instalación y Uso

Sigue estos pasos para correr el proyecto en tu computadora:

### 1. Clonar el repositorio
```bash
git clone https://github.com/gumlester5-spec/el-impostor-2.0.git
cd impostor-secreto
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar la API Key de Google Gemini
Este proyecto requiere una API Key válida de Google AI Studio.

1.  Obtén tu clave gratis en: [aistudio.google.com](https://aistudio.google.com/).
2.  Crea un archivo `.env` en la raíz del proyecto (o renombra `.env.example`).
3.  Agrega tu clave:

```env
API_KEY=tu_clave_de_api_aqui
```

> **Nota:** El código utiliza `process.env.API_KEY`. Asegúrate de que tu entorno de desarrollo (como Vite) inyecte esta variable correctamente (en Vite sería `VITE_API_KEY` y requeriría un pequeño ajuste en `geminiService.ts` o usar un plugin de define).

### 4. Ejecutar el proyecto
```bash
npm start
# O si usas Vite
npm run dev
```

Abre tu navegador en `http://localhost:3000` (o el puerto que indique la consola).

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la lógica de deducción de la IA o nuevos modos de juego:

1.  Haz un Fork del proyecto.
2.  Crea una rama (`git checkout -b feature/NuevaFeature`).
3.  Haz Commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`).
4.  Haz Push a la rama (`git push origin feature/NuevaFeature`).
5.  Abre un Pull Request.

## 📄 Licencia

Este proyecto es libre 

---

Hecho con ❤️ e 🤖 por Lester

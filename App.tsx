import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WORDS, AVATARS, TOTAL_ROUNDS, REVEAL_TIME_SECONDS, DEFAULT_CONFIG } from './constants';
import { Role, Phase, Player, Message, GameConfig } from './types';
import { getAiClue, getAiVote } from './services/geminiService';
import { Button } from './components/Button';
import { PlayerCard } from './components/PlayerCard';
import { Avatar } from './components/Avatar';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // --- State ---
  const [phase, setPhase] = useState<Phase>(Phase.Lobby);
  const [secretWord, setSecretWord] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [revealTimer, setRevealTimer] = useState<number>(REVEAL_TIME_SECONDS);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [winner, setWinner] = useState<Role | 'DRAW' | null>(null);
  
  // Customization State
  const [gameConfig, setGameConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);

  // User input for clue
  const [userInput, setUserInput] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Refs for scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reveal Phase Timer
  useEffect(() => {
    if (phase === Phase.Reveal) {
      if (revealTimer > 0) {
        const timer = setTimeout(() => setRevealTimer(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase(Phase.Playing);
      }
    }
  }, [phase, revealTimer]);

  // AI Turn Logic
  useEffect(() => {
    if (phase === Phase.Playing && !isAiProcessing) {
      const currentPlayer = players[currentTurnIndex];
      if (currentPlayer.isAi) {
        handleAiTurn(currentPlayer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentTurnIndex, players, secretWord]);

  // Voting Phase Logic - Trigger AI Votes
  useEffect(() => {
    if (phase === Phase.Voting && userVote && !isAiProcessing) {
      // Once user votes, trigger AI votes
      handleAiVotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, userVote]);


  // --- Game Logic Functions ---

  const startGame = () => {
    // 1. Select Word
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSecretWord(word);

    // 2. Assign Roles
    // One Impostor, Two Innocents
    const roles = [Role.Impostor, Role.Innocent, Role.Innocent];
    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // 3. Create Players using GameConfig
    const newPlayers: Player[] = [
      { 
        id: 'user', 
        name: gameConfig.user.name, 
        isAi: false, 
        role: roles[0], 
        avatar: gameConfig.user.avatar, 
        votesReceived: 0 
      },
      { 
        id: 'ai1', 
        name: gameConfig.ai1.name, 
        isAi: true, 
        role: roles[1], 
        avatar: gameConfig.ai1.avatar, 
        votesReceived: 0 
      },
      { 
        id: 'ai2', 
        name: gameConfig.ai2.name, 
        isAi: true, 
        role: roles[2], 
        avatar: gameConfig.ai2.avatar, 
        votesReceived: 0 
      },
    ];

    // Shuffle turn order initially
    for (let i = newPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPlayers[i], newPlayers[j]] = [newPlayers[j], newPlayers[i]];
    }

    setPlayers(newPlayers);
    setMessages([]);
    setCurrentRound(1);
    setCurrentTurnIndex(0);
    setRevealTimer(REVEAL_TIME_SECONDS);
    setUserVote(null);
    setWinner(null);
    setPhase(Phase.Reveal);
  };

  const handleNextTurn = () => {
    const nextIndex = (currentTurnIndex + 1) % players.length;
    
    // Check if round is over
    // Round is over when we wrap around to 0
    if (nextIndex === 0) {
      if (currentRound < TOTAL_ROUNDS) {
        setCurrentRound(prev => prev + 1);
        setCurrentTurnIndex(0);
      } else {
        setPhase(Phase.Voting);
      }
    } else {
      setCurrentTurnIndex(nextIndex);
    }
  };

  const handleAiTurn = async (aiPlayer: Player) => {
    setIsAiProcessing(true);
    // Simulate thinking time for realism
    await new Promise(resolve => setTimeout(resolve, 1500));

    const clue = await getAiClue(aiPlayer, secretWord, messages);
    
    addMessage(aiPlayer, clue);
    setIsAiProcessing(false);
    handleNextTurn();
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const currentPlayer = players[currentTurnIndex];
    addMessage(currentPlayer, userInput);
    setUserInput("");
    handleNextTurn();
  };

  const addMessage = (player: Player, text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        playerId: player.id,
        playerName: player.name,
        text,
        round: currentRound
      }
    ]);
  };

  const handleAiVotes = async () => {
    setIsAiProcessing(true);
    const aiPlayers = players.filter(p => p.isAi);
    const votes: Record<string, string> = {}; // voterId -> targetId

    // Get votes from AI
    for (const aiPlayer of aiPlayers) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Stagger votes
        const voteTargetId = await getAiVote(aiPlayer, players, secretWord, messages);
        votes[aiPlayer.id] = voteTargetId;
    }

    // Add user vote
    if (userVote) {
        votes['user'] = userVote;
    }

    calculateResults(votes);
    setIsAiProcessing(false);
  };

  const calculateResults = (votes: Record<string, string>) => {
    // Tally votes
    const voteCounts: Record<string, number> = {};
    players.forEach(p => voteCounts[p.id] = 0);

    Object.values(votes).forEach(targetId => {
        if (voteCounts[targetId] !== undefined) {
            voteCounts[targetId]++;
        }
    });

    // Update players state to show votes received (for UI)
    const updatedPlayers = players.map(p => ({
        ...p,
        votesReceived: voteCounts[p.id]
    }));
    setPlayers(updatedPlayers);

    // Determine Result
    // Find max votes
    let maxVotes = 0;
    Object.values(voteCounts).forEach(count => {
        if (count > maxVotes) maxVotes = count;
    });

    // Find who got max votes
    const kickedPlayers = updatedPlayers.filter(p => p.votesReceived === maxVotes);

    let result: Role | 'DRAW';

    if (kickedPlayers.length > 1) {
        // Tie - Impostor survives (or technically a draw, but usually a win for Impostor in short games)
        // Specs say: "Empate: Nadie es expulsado y técnicamente el Impostor sobrevive"
        result = 'DRAW';
    } else {
        const kickedOne = kickedPlayers[0];
        if (kickedOne.role === Role.Impostor) {
            // Impostor kicked -> Innocents Win
            result = Role.Innocent;
        } else {
            // Innocent kicked -> Impostor Wins
            result = Role.Impostor;
        }
    }

    setWinner(result);
    setPhase(Phase.Result);
  };

  // --- Render Helpers ---

  const renderLobby = () => (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center animate-fadeIn relative">
      <div className="text-6xl mb-4 bg-slate-800 p-6 rounded-full shadow-2xl shadow-indigo-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-indigo-400">
          <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-4.423 6.002 6.002 0 00-1.207-7.053.75.75 0 00-1.172.887 4.5 4.5 0 012.43 3.974c0 1.26-.519 2.457-1.446 3.385a.75.75 0 00.57 1.228z" />
        </svg>
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
        IMPOSTOR SECRETO
      </h1>
      <p className="text-slate-400 max-w-md">
        3 Jugadores. 1 Impostor. Una palabra secreta.
        <br />
        Descubre quién miente o engaña a todos para ganar.
      </p>
      
      <div className="flex flex-col w-full max-w-xs gap-3">
        <Button onClick={startGame} className="animate-pulse">
          COMENZAR PARTIDA
        </Button>
        <Button variant="secondary" onClick={() => setShowSettings(true)}>
          ⚙️ Personalizar Jugadores
        </Button>
      </div>
    </div>
  );

  const renderReveal = () => {
    const user = players.find(p => p.id === 'user');
    if (!user) return null;
    const isImpostor = user.role === Role.Impostor;

    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center animate-fadeIn">
        <h2 className="text-2xl text-slate-300">Tu Rol es:</h2>
        
        <div className={`p-8 rounded-3xl border-4 shadow-2xl transition-all duration-500 transform scale-110 ${
          isImpostor ? 'bg-rose-950 border-rose-600' : 'bg-indigo-950 border-indigo-500'
        }`}>
          <h1 className={`text-4xl font-black mb-4 ${isImpostor ? 'text-rose-500' : 'text-indigo-400'}`}>
            {isImpostor ? '🤫 IMPOSTOR' : '😇 INOCENTE'}
          </h1>
          
          <div className="bg-black/30 p-4 rounded-xl">
            {isImpostor ? (
              <p className="text-rose-200">
                Finge que sabes la palabra.<br/>No dejes que te descubran.
              </p>
            ) : (
              <div>
                <p className="text-indigo-200 mb-2">La palabra secreta es:</p>
                <p className="text-3xl font-bold text-white tracking-widest uppercase">{secretWord}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center text-2xl font-bold">
            {revealTimer}
          </div>
          <p className="text-xs text-slate-500 mt-2">Memoriza esto</p>
        </div>
      </div>
    );
  };

  const renderGameArea = () => {
    const currentPlayer = players[currentTurnIndex];
    const isUserTurn = currentPlayer.id === 'user';
    const userPlayer = players.find(p => p.id === 'user');

    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
        {/* Header Info */}
        <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-b-xl border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ronda</span>
            <p className="text-xl font-bold text-white">{currentRound} / {TOTAL_ROUNDS}</p>
          </div>
          
          <div className="text-right">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tu Rol</span>
             <p className={`font-bold ${userPlayer?.role === Role.Impostor ? 'text-rose-500' : 'text-indigo-400'}`}>
               {userPlayer?.role === Role.Impostor ? 'IMPOSTOR' : 'INOCENTE'}
               {userPlayer?.role === Role.Innocent && <span className="text-white ml-2 text-sm opacity-50">({secretWord})</span>}
             </p>
          </div>
        </div>

        {/* Players Top Bar */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 p-4">
          {players.map(p => (
            <PlayerCard 
              key={p.id} 
              player={p} 
              isActive={phase === Phase.Playing && p.id === currentPlayer.id} 
              isVoting={false}
            />
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30 mx-4 rounded-xl border border-slate-800/50 shadow-inner">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-10 italic">
              La partida comienza... {players[0].name} empieza.
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.playerId === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm md:text-base shadow-md ${
                msg.playerId === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-slate-700 text-slate-100 rounded-bl-none'
              }`}>
                <span className="text-xs opacity-50 block mb-1 font-bold">{msg.playerName}</span>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4">
          {isUserTurn ? (
            <form onSubmit={handleUserSubmit} className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Escribe tu pista (1-5 palabras)..."
                maxLength={50}
                className="flex-1 bg-slate-800 border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <Button type="submit" disabled={!userInput.trim()}>
                Enviar
              </Button>
            </form>
          ) : (
             <div className="h-14 flex items-center justify-center text-slate-500 italic bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
               Esperando a {currentPlayer.name}...
             </div>
          )}
        </div>
      </div>
    );
  };

  const renderVoting = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 gap-8 animate-fadeIn">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">¡VOTACIÓN!</h2>
          <p className="text-slate-400">¿Quién crees que es el Impostor?</p>
          {userVote && <p className="text-indigo-400 mt-2 font-bold animate-pulse">Esperando a las IAs...</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {players.filter(p => p.id !== 'user').map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              isActive={false}
              isVoting={!userVote} // Disable clicking if already voted
              hasVoted={false}
              onVote={(id) => setUserVote(id)}
            />
          ))}
        </div>
        
        {/* Render user card just for context, usually you don't vote for self */}
        <div className="opacity-50 pointer-events-none transform scale-75">
            <PlayerCard 
                player={players.find(p => p.id === 'user')!} 
                isActive={false} 
                isVoting={false} 
            />
             <p className="text-center text-xs mt-2">Tú</p>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const impostor = players.find(p => p.role === Role.Impostor);
    const userWon = (winner === Role.Innocent && players.find(p => p.id === 'user')?.role === Role.Innocent) ||
                    (winner === Role.Impostor && players.find(p => p.id === 'user')?.role === Role.Impostor);
    
    // Determine header text
    let title = "";
    let colorClass = "";
    if (winner === 'DRAW') {
        title = "EMPATE ⚖️";
        colorClass = "text-yellow-400";
    } else if (winner === Role.Innocent) {
        title = "¡INOCENTES GANAN! 🎉";
        colorClass = "text-green-400";
    } else {
        title = "¡IMPOSTOR GANA! 😈";
        colorClass = "text-rose-500";
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-4 gap-6 animate-fadeIn text-center">
        <h1 className={`text-4xl md:text-5xl font-black ${colorClass} mb-4`}>{title}</h1>
        
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 max-w-md w-full">
            <p className="text-slate-400 mb-2">La palabra secreta era:</p>
            <p className="text-2xl font-bold text-white uppercase tracking-wider mb-6">{secretWord}</p>

            <p className="text-slate-400 mb-2">El Impostor era:</p>
            <div className="flex flex-col items-center justify-center gap-2 mb-6">
                <Avatar type={impostor?.avatar || ''} size="lg" />
                <span className="text-xl font-bold text-white">{impostor?.name}</span>
            </div>

             <div className="border-t border-slate-700 pt-4 w-full">
                <p className="text-sm font-bold text-slate-300 mb-2">Resultados de la Votación:</p>
                <div className="space-y-2">
                    {players.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                            <span>{p.name} {p.role === Role.Impostor && '😈'}</span>
                            <span className="font-mono text-slate-400">{p.votesReceived} votos</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-4">
            <p className="text-lg mb-4 text-white">
                {userWon ? "¡Felicidades, ganaste!" : "Suerte para la próxima..."}
            </p>
            <Button onClick={startGame} variant="primary">
                JUGAR OTRA VEZ
            </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 overflow-hidden flex flex-col font-sans">
        {/* Main Content Container */}
        <main className="flex-1 w-full max-w-5xl mx-auto h-[100dvh]">
          {phase === Phase.Lobby && renderLobby()}
          {phase === Phase.Reveal && renderReveal()}
          {phase === Phase.Playing && renderGameArea()}
          {phase === Phase.Voting && renderVoting()}
          {phase === Phase.Result && renderResult()}
        </main>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal 
            initialConfig={gameConfig} 
            onClose={() => setShowSettings(false)}
            onSave={(newConfig) => {
              setGameConfig(newConfig);
              setShowSettings(false);
            }}
          />
        )}
    </div>
  );
};

export default App;
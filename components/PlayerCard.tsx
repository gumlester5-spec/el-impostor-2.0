import React from 'react';
import { Player } from '../types';
import { Avatar } from './Avatar';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  isVoting: boolean;
  onVote?: (playerId: string) => void;
  hasVoted?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isActive, 
  isVoting, 
  onVote,
  hasVoted
}) => {
  return (
    <div className={`
      relative p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300
      ${isActive ? 'bg-indigo-900/60 ring-2 ring-indigo-400 scale-105 shadow-xl shadow-indigo-900/40' : 'bg-slate-800/50 border border-slate-700 shadow-lg'}
      ${isVoting && !hasVoted ? 'cursor-pointer hover:bg-rose-900/40 hover:border-rose-500' : ''}
    `}
    onClick={() => {
      if (isVoting && onVote) onVote(player.id);
    }}
    >
      <div className={`${isActive ? 'animate-bounce-slow' : ''}`}>
        <Avatar type={player.avatar} size="lg" />
      </div>
      
      <div className="text-center w-full">
        <h3 className="font-bold text-white tracking-wide">{player.name}</h3>
        {isActive && !isVoting && (
          <span className="text-xs text-indigo-300 animate-pulse font-mono block mt-1">Pensando...</span>
        )}
        {hasVoted && (
          <span className="text-xs text-green-400 font-bold bg-green-900/30 px-2 py-1 rounded-full mt-1 inline-block">✓ Votó</span>
        )}
      </div>

      {isVoting && !hasVoted && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
          <span className="bg-rose-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg transform scale-110">VOTAR</span>
        </div>
      )}
    </div>
  );
};

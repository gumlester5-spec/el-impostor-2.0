import React, { useState } from 'react';
import { GameConfig, PlayerConfig } from '../types';
import { Button } from './Button';
import { Avatar } from './Avatar';

interface SettingsModalProps {
  initialConfig: GameConfig;
  onSave: (config: GameConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ initialConfig, onSave, onClose }) => {
  const [config, setConfig] = useState<GameConfig>(initialConfig);

  const handleNameChange = (key: keyof GameConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], name: value }
    }));
  };

  const handleImageUpload = (key: keyof GameConfig, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({
          ...prev,
          [key]: { ...prev[key], avatar: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPlayerField = (key: keyof GameConfig, label: string) => (
    <div className="flex flex-col gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-slate-300 font-bold text-sm uppercase">{label}</h3>
      <div className="flex items-center gap-4">
        <div className="relative group cursor-pointer">
          <Avatar type={config[key].avatar} size="lg" />
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-white font-bold">CAMBIAR</span>
          </div>
          <input 
            type="file" 
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => handleImageUpload(key, e)}
          />
        </div>
        <div className="flex-1">
          <input 
            type="text"
            value={config[key].name}
            onChange={(e) => handleNameChange(key, e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nombre..."
            maxLength={12}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">Personalizar Partida</h2>
          <p className="text-slate-400 text-sm">Cambia los nombres y fotos de los jugadores.</p>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {renderPlayerField('user', 'Tú (Jugador Principal)')}
          {renderPlayerField('ai1', 'IA 1 (Oponente)')}
          {renderPlayerField('ai2', 'IA 2 (Oponente)')}
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-4">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => onSave(config)} fullWidth>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
};
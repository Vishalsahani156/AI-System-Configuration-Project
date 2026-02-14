
import React from 'react';
import { AvatarConfig, UserStats } from '../types';

interface Option {
  id: string;
  name: string;
  icon: string;
  minLevel: number;
}

const HAIR_OPTIONS: Option[] = [
  { id: 'classic', name: 'Classic Twintails', icon: 'fa-scissors', minLevel: 1 },
  { id: 'ponytail', name: 'Sporty Ponytail', icon: 'fa-cut', minLevel: 2 },
  { id: 'bob', name: 'Cyber Bob', icon: 'fa-wind', minLevel: 3 },
  { id: 'braid', name: 'Elegant Braid', icon: 'fa-braille', minLevel: 4 },
  { id: 'long', name: 'Flowing Silk', icon: 'fa-ellipsis-vertical', minLevel: 5 },
  { id: 'bun', name: 'Traditional Bun', icon: 'fa-circle-nodes', minLevel: 6 },
];

const OUTFIT_OPTIONS: Option[] = [
  { id: 'school', name: 'Kawaii Uniform', icon: 'fa-graduation-cap', minLevel: 1 },
  { id: 'tech', name: 'Neon Runner', icon: 'fa-bolt', minLevel: 4 },
  { id: 'ethnic', name: 'Cyber Saree', icon: 'fa-gem', minLevel: 7 },
];

const ACC_OPTIONS: Option[] = [
  { id: 'none', name: 'None', icon: 'fa-xmark', minLevel: 1 },
  { id: 'headphones', name: 'Kitty Ears', icon: 'fa-headphones', minLevel: 2 },
  { id: 'glasses', name: 'Smart Specs', icon: 'fa-glasses', minLevel: 3 },
  { id: 'halo', name: 'Angelic Halo', icon: 'fa-ring', minLevel: 5 },
  { id: 'tiara', name: 'System Tiara', icon: 'fa-crown', minLevel: 8 },
];

interface Props {
  config: AvatarConfig;
  stats: UserStats;
  onUpdate: (config: AvatarConfig) => void;
  onClose: () => void;
}

const AvatarCustomizer: React.FC<Props> = ({ config, stats, onUpdate, onClose }) => {
  const renderSection = (title: string, current: string, key: keyof AvatarConfig, options: Option[]) => (
    <div className="mb-6">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isLocked = stats.level < opt.minLevel;
          return (
            <button
              key={opt.id}
              disabled={isLocked}
              onClick={() => onUpdate({ ...config, [key]: opt.id })}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all relative ${
                current === opt.id 
                  ? 'bg-pink-500/20 border-pink-500 text-pink-400' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
              } ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <i className={`fa-solid ${opt.icon} text-lg`}></i>
              <span className="text-[10px] text-center font-medium leading-tight">{opt.name}</span>
              {isLocked && (
                <div className="absolute top-1 right-1">
                  <i className="fa-solid fa-lock text-[8px]"></i>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Style Riyu</h3>
            <p className="text-xs text-slate-500">Level {stats.level} Fashionista</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors"><i className="fa-solid fa-xmark"></i></button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderSection('Hairstyle', config.hair, 'hair', HAIR_OPTIONS)}
          {renderSection('Outfits', config.outfit, 'outfit', OUTFIT_OPTIONS)}
          {renderSection('Accessories', config.accessory, 'accessory', ACC_OPTIONS)}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 text-center">
            Earn Relationship Points by chatting with Riyu to unlock more styles!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;

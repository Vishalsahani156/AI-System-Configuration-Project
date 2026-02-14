
import React from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (agent: Agent) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(agent)}
      className={`relative p-4 rounded-2xl border transition-all duration-500 text-left w-full group overflow-hidden
        ${isSelected 
          ? `bg-white/10 border-white/20 shadow-xl shadow-purple-500/10` 
          : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/5'
        }`}
    >
      {isSelected && (
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${agent.color}`}></div>
      )}
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all
          ${isSelected ? `bg-gradient-to-br ${agent.color} text-white` : `bg-white/5 text-slate-500 group-hover:text-slate-300`}`}>
          <i className={`fa-solid ${agent.icon}`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold truncate tracking-wide ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
            {agent.name}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">{agent.role}</p>
        </div>
      </div>
    </button>
  );
};

export default AgentCard;

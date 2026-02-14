
import React, { useEffect, useState } from 'react';
import { Agent, AgentStatus } from '../types';

interface AgentCardProps {
  agent: Agent;
  status: AgentStatus;
  isUnresponsive?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, status, isUnresponsive }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 600);
    return () => clearTimeout(timer);
  }, [status, isUnresponsive]);

  const getStatusColor = () => {
    if (isUnresponsive && status === AgentStatus.IDLE) return 'border-slate-800 bg-slate-950/40 opacity-75 grayscale-[0.3]';
    switch (status) {
      case AgentStatus.THINKING: return 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] bg-blue-500/5';
      case AgentStatus.ACTING: return 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-purple-500/5';
      case AgentStatus.COMPLETED: return 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-emerald-500/5';
      case AgentStatus.FAILED: return 'border-red-500 shadow-[0_0_20_rgba(239,68,68,0.4)] bg-red-500/5';
      default: return 'border-slate-800 bg-slate-900/50';
    }
  };

  const getStatusText = () => {
    if (isUnresponsive && status === AgentStatus.IDLE) return 'Hibernating';
    switch (status) {
      case AgentStatus.THINKING: return 'Analyzing...';
      case AgentStatus.ACTING: return 'Fixing...';
      case AgentStatus.COMPLETED: return 'Verified';
      case AgentStatus.FAILED: return 'Alert';
      default: return 'Standby';
    }
  };

  const getStatusDotColor = () => {
    if (isUnresponsive && status === AgentStatus.IDLE) return 'bg-slate-700';
    switch (status) {
      case AgentStatus.THINKING: return 'bg-blue-400';
      case AgentStatus.ACTING: return 'bg-purple-400';
      case AgentStatus.COMPLETED: return 'bg-emerald-400';
      case AgentStatus.FAILED: return 'bg-red-400';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div 
      className={`
        relative p-4 rounded-xl border transition-all duration-500 
        ${getStatusColor()}
        ${isUpdating ? 'scale-[1.02] ring-1 ring-white/10' : 'scale-100'}
        ${isUnresponsive && status === AgentStatus.IDLE ? 'hover:grayscale-0 hover:opacity-100' : ''}
      `}
    >
      {/* Hibernating Indicator */}
      {isUnresponsive && status === AgentStatus.IDLE && (
        <div className="absolute top-2 right-2 flex items-center gap-1 animate-pulse">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Standby Mode</span>
          <span className="text-xs">💤</span>
        </div>
      )}

      <div className="group relative flex items-center gap-3 mb-3 cursor-help">
        <span className={`
          text-3xl transition-all duration-500 
          ${isUpdating ? 'rotate-12 scale-125' : 'rotate-0 scale-100'}
          ${isUnresponsive && status === AgentStatus.IDLE ? 'opacity-40 grayscale' : 'opacity-100'}
          group-hover:scale-110 group-hover:grayscale-0 group-hover:opacity-100
        `}>
          {agent.icon}
        </span>
        <div className="flex-1 overflow-hidden">
          <h3 className={`font-bold text-slate-100 group-hover:text-blue-400 transition-colors truncate`}>{agent.name}</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">{agent.role}</p>
        </div>

        <div className="absolute bottom-full left-0 mb-3 w-72 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl opacity-0 scale-95 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 z-[100] backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Agent Intelligence</div>
            <div className="px-2 py-0.5 rounded-sm bg-slate-700 text-[9px] text-slate-300 font-bold uppercase">{agent.role}</div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mission Strategy</div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                "{agent.description}"
              </p>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Autonomous Triggers</div>
              <div className="flex flex-wrap gap-1">
                {agent.subscriptions.map((sub, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-sm bg-blue-900/40 text-blue-300 text-[8px] font-mono border border-blue-800/50">
                    {sub.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute top-full left-6 -mt-px border-8 border-transparent border-t-slate-800"></div>
        </div>
      </div>

      <div className="relative mb-4">
        <p className={`text-xs leading-relaxed line-clamp-2 h-8 transition-colors ${isUnresponsive && status === AgentStatus.IDLE ? 'text-slate-600' : 'text-slate-400'}`}>
          {agent.description}
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`h-2 w-2 rounded-full transition-colors duration-500 ${getStatusDotColor()}`} />
            {status !== AgentStatus.IDLE && status !== AgentStatus.FAILED && (
              <div className={`absolute inset-0 h-2 w-2 rounded-full ${getStatusDotColor()} animate-ping opacity-75`} />
            )}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${status === AgentStatus.IDLE ? 'text-slate-500' : 'text-slate-200'} ${isUnresponsive && status === AgentStatus.IDLE ? 'animate-pulse text-slate-600' : ''}`}>
            {getStatusText()}
          </span>
        </div>
        
        {status === AgentStatus.ACTING && (
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-purple-500/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-3 bg-purple-500/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-3 bg-purple-500/50 rounded-full animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCard;


import React from 'react';
import { TriggerEvent, TriggerType } from '../types';

interface TriggerBusProps {
  activeTriggers: TriggerEvent[];
}

const TriggerBus: React.FC<TriggerBusProps> = ({ activeTriggers }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6 min-h-[44px]">
      {activeTriggers.length === 0 && (
        <div className="flex items-center gap-2 text-slate-600 text-xs italic">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
          Bus Idle. No active signals.
        </div>
      )}
      {activeTriggers.map((trigger) => (
        <div 
          key={trigger.id}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/50 text-blue-300 text-[10px] font-bold tracking-wider animate-in zoom-in duration-300 shadow-[0_0_10px_rgba(59,130,246,0.3)] uppercase"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          {trigger.type.replace('_', ' ')}
          <span className="text-blue-500/60 font-mono">| {trigger.source}</span>
        </div>
      ))}
    </div>
  );
};

export default TriggerBus;

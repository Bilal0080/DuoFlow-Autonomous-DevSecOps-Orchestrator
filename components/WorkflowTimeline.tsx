
import React from 'react';
import { WorkflowEvent } from '../types';

interface WorkflowTimelineProps {
  events: WorkflowEvent[];
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ events }) => {
  return (
    <div className="bg-black/80 rounded-lg p-4 font-mono text-sm h-[400px] overflow-y-auto border border-slate-800 shadow-inner">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
        <span className="text-slate-500 text-xs">duo-orchestrator-shell</span>
      </div>
      
      {events.length === 0 && (
        <div className="text-slate-600 italic">Waiting for trigger event...</div>
      )}
      
      {events.map((event) => (
        <div key={event.id} className="mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="text-slate-500">[{new Date(event.timestamp).toLocaleTimeString()}]</span>{' '}
          <span className="text-blue-400">[{event.agentId}]</span>{' '}
          <span className={`
            ${event.type === 'error' ? 'text-red-400' : ''}
            ${event.type === 'warning' ? 'text-yellow-400' : ''}
            ${event.type === 'success' ? 'text-emerald-400' : ''}
            ${event.type === 'info' ? 'text-slate-200' : ''}
          `}>
            {event.message}
          </span>
        </div>
      ))}
    </div>
  );
};

export default WorkflowTimeline;

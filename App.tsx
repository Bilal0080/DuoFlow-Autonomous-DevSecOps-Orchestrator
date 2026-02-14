
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AgentStatus, WorkflowEvent, AnalysisResult, RiskDataPoint, TriggerType, TriggerEvent, AgentRole } from './types';
import { AGENTS, INITIAL_CODE_SAMPLE } from './constants';
import { runAgentAnalysis, parseStructuredFindings } from './services/geminiService';
import AgentCard from './components/AgentCard';
import WorkflowTimeline from './components/WorkflowTimeline';
import TriggerBus from './components/TriggerBus';

type TimeRange = 'LIVE' | '1H' | '24H' | '7D';

const App: React.FC = () => {
  const [code, setCode] = useState(INITIAL_CODE_SAMPLE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [findings, setFindings] = useState<AnalysisResult[]>([]);
  const [riskHistory, setRiskHistory] = useState<RiskDataPoint[]>([]);
  const [showStory, setShowStory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [triggerQueue, setTriggerQueue] = useState<TriggerEvent[]>([]);
  const [processedTriggers, setProcessedTriggers] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<AgentRole | 'ALL'>('ALL');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('LIVE');
  
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(
    AGENTS.reduce((acc, agent) => ({ ...acc, [agent.id]: AgentStatus.IDLE }), {})
  );

  // Initialize with some mock historical data
  useEffect(() => {
    const now = Date.now();
    const mockData: RiskDataPoint[] = [];
    // Generate data for the last 7 days
    for (let i = 100; i >= 0; i--) {
      mockData.push({
        timestamp: now - (i * 1000 * 60 * 60 * 2), // every 2 hours
        score: Math.floor(Math.random() * 40) + 10
      });
    }
    setRiskHistory(mockData);
  }, []);

  const addEvent = useCallback((agentId: string, message: string, type: WorkflowEvent['type'] = 'info') => {
    setEvents(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        agentId,
        message,
        type
      }
    ]);
  }, []);

  const emitTrigger = useCallback((type: TriggerType, source: string) => {
    const trigger: TriggerEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      source,
      timestamp: Date.now()
    };
    setTriggerQueue(prev => [...prev, trigger]);
    addEvent('SYSTEM', `Signal Emitted: ${type.replace('_', ' ')} (via ${source})`, 'trigger');
  }, [addEvent]);

  const updateAgentStatus = (agentId: string, status: AgentStatus) => {
    setAgentStatuses(prev => ({ ...prev, [agentId]: status }));
  };

  // Agent counts by role
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: AGENTS.length };
    AGENTS.forEach(agent => {
      counts[agent.role] = (counts[agent.role] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredAgents = useMemo(() => {
    if (selectedRole === 'ALL') return AGENTS;
    return AGENTS.filter(agent => agent.role === selectedRole);
  }, [selectedRole]);

  // Filter risk history based on selected range
  const filteredRiskData = useMemo(() => {
    const now = Date.now();
    let cutOff = 0;
    
    switch (selectedRange) {
      case '1H': cutOff = now - 60 * 60 * 1000; break;
      case '24H': cutOff = now - 24 * 60 * 60 * 1000; break;
      case '7D': cutOff = now - 7 * 24 * 60 * 60 * 1000; break;
      case 'LIVE':
      default:
        // For LIVE, we just show the last 15 entries
        return riskHistory.slice(-15).map(d => ({
          ...d,
          displayTime: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
    }

    return riskHistory
      .filter(d => d.timestamp >= cutOff)
      .map(d => ({
        ...d,
        displayTime: new Date(d.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }));
  }, [riskHistory, selectedRange]);

  // The Autonomous Orchestration Engine
  useEffect(() => {
    if (triggerQueue.length === 0) return;

    const processNextTrigger = async () => {
      const trigger = triggerQueue[0];
      if (processedTriggers.has(trigger.id)) {
        setTriggerQueue(prev => prev.slice(1));
        return;
      }

      setProcessedTriggers(prev => new Set(prev).add(trigger.id));

      const relevantAgents = AGENTS.filter(a => 
        a.subscriptions.includes(trigger.type) && a.name !== trigger.source
      );
      
      if (relevantAgents.length === 0) {
        setTriggerQueue(prev => prev.slice(1));
        return;
      }

      await Promise.all(relevantAgents.map(async (agent) => {
        updateAgentStatus(agent.id, AgentStatus.THINKING);
        addEvent(agent.name, `Reacting to ${trigger.type.replace('_', ' ')}...`);

        try {
          const rawAnalysis = await runAgentAnalysis(agent.role, code);
          const structured = await parseStructuredFindings(rawAnalysis);
          
          setFindings(prev => [...prev, ...structured]);
          updateAgentStatus(agent.id, AgentStatus.COMPLETED);
          addEvent(agent.name, `Task complete. Found ${structured.length} actionable items.`);

          if (agent.role === 'SECURITY' && structured.some(f => f.severity === 'high' || f.severity === 'medium')) {
            emitTrigger(TriggerType.VULNERABILITY_DETECTED, agent.name);
          } else if (agent.role === 'PERFORMANCE' && structured.length > 0) {
            emitTrigger(TriggerType.INEFFICIENCY_DETECTED, agent.name);
          } else if (agent.name === 'SchemaGuardian' && structured.length > 0) {
            emitTrigger(TriggerType.SCHEMA_MISMATCH, agent.name);
          } else if (agent.role === 'REFACTOR') {
            emitTrigger(TriggerType.REFACTOR_COMPLETE, agent.name);
          } else if (agent.role === 'INTEGRATION') {
            if (structured.some(f => f.severity === 'high')) {
              emitTrigger(TriggerType.BUILD_FAILED, agent.name);
            } else {
              emitTrigger(TriggerType.DEPLOYMENT_STARTED, agent.name);
            }
          }
          
        } catch (error: any) {
          updateAgentStatus(agent.id, AgentStatus.FAILED);
          const errorMessage = error.message || 'Unknown execution error';
          addEvent(agent.name, `CRITICAL FAILURE: ${errorMessage}`, 'error');
        }
      }));

      setTriggerQueue(prev => prev.slice(1));
    };

    processNextTrigger();
  }, [triggerQueue, processedTriggers, code, addEvent, emitTrigger]);

  const startWorkflow = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowConfirmModal(false);
    setEvents([]);
    setFindings([]);
    setProcessedTriggers(new Set());
    setAgentStatuses(AGENTS.reduce((acc, agent) => ({ ...acc, [agent.id]: AgentStatus.IDLE }), {}));
    
    emitTrigger(TriggerType.CODE_SUBMITTED, 'DEV_COMMIT_WEBHOOK');
    
    setTimeout(() => setIsProcessing(false), 2000);
  };

  useEffect(() => {
    if (findings.length === 0) return;
    const riskScore = findings.reduce((acc, f) => {
      if (f.severity === 'high') return acc + 40;
      if (f.severity === 'medium') return acc + 20;
      return acc + 10;
    }, 0);
    
    setRiskHistory(prev => [
      ...prev,
      { timestamp: Date.now(), score: Math.min(riskScore, 100) }
    ]);
  }, [findings]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200">
      <header className="border-b border-slate-800 bg-[#0f141d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-red-600 rounded-lg flex items-center justify-center font-bold text-white italic">D</div>
            <h1 className="text-xl font-bold tracking-tight text-white">DuoFlow <span className="text-slate-500 font-normal">| AI Orchestrator</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowStory(!showStory)}
              className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors mr-4"
            >
              The Story
            </button>
            <button 
              onClick={() => setShowConfirmModal(true)}
              disabled={isProcessing || triggerQueue.length > 0}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg active:scale-95 ${
                (isProcessing || triggerQueue.length > 0)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
              }`}
            >
              {(isProcessing || triggerQueue.length > 0) ? 'Pipeline Active...' : 'Trigger Analysis Pipeline'}
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-slate-700 max-w-md w-full rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <h2 className="text-xl font-bold text-white mb-4">Initialize Pipeline?</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Are you sure you want to start the analysis pipeline? This will wake the autonomous trigger bus and initiate multi-agent code auditing.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={startWorkflow}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                Start Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {showStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-slate-700 max-w-2xl w-full rounded-2xl p-8 shadow-2xl relative">
            <button onClick={() => setShowStory(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-bold text-white mb-6">The DuoFlow Story</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="text-2xl mt-1">😫</div>
                <div>
                  <h3 className="font-bold text-red-400 mb-1">The Pain</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Developers are overwhelmed by manual security gates. Manual intervention is the bottleneck of modern software cycles.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl mt-1">🤖</div>
                <div>
                  <h3 className="font-bold text-blue-400 mb-1">The Solution</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">DuoFlow uses an <b>Autonomous Trigger Bus</b>. Agents listen for specific signals and act without human input.</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowStory(false)} className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-white transition-colors">Got it, let's build!</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <TriggerBus activeTriggers={triggerQueue} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-blue-500">#</span> Active Manifesto
                </h2>
                <span className="text-xs text-slate-500 font-mono">index.js • utf-8</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#161b22] shadow-2xl">
                <div className="bg-[#1c2128] px-4 py-2 border-b border-slate-800 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-80 bg-transparent p-6 font-mono text-sm text-blue-100 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </section>

            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-purple-500">#</span> Specialized Agents
                </h2>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'SECURITY', 'REVIEWER', 'PERFORMANCE', 'COMPLIANCE', 'REFACTOR', 'INTEGRATION'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role as any)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                        ${selectedRole === role 
                          ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                        }
                      `}
                    >
                      {role === 'ALL' ? 'All Units' : role}
                      <span className={`
                        px-1.5 py-0.5 rounded-md text-[10px] leading-none
                        ${selectedRole === role ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}
                      `}>
                        {roleCounts[role] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map(agent => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    status={agentStatuses[agent.id]} 
                  />
                ))}
              </div>
            </section>

            {findings.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-red-500">#</span> Identified Issues
                </h2>
                <div className="space-y-3">
                  {findings.map((f, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-red-950/20 border border-red-900/30 flex items-start gap-4">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${f.severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-yellow-500'}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-400">{f.severity} RISK</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-sm font-medium text-slate-200">{f.issue}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">Location: <code className="bg-slate-800 px-1 rounded">{f.location}</code></p>
                        <p className="text-sm text-slate-300 italic">" {f.remediation} "</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-emerald-500">#</span> Live Logs
              </h2>
              <WorkflowTimeline events={events} />
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-yellow-500">#</span> Risk Analytics
                </h2>
                <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  {(['LIVE', '1H', '24H', '7D'] as TimeRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRange(r)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                        selectedRange === r ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredRiskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="displayTime" 
                      stroke="#64748b" 
                      fontSize={8} 
                      tick={{ fill: '#64748b' }}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      domain={[0, 100]} 
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }} 
                      itemStyle={{ color: '#3b82f6' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={selectedRange === 'LIVE'} 
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20">
              <h3 className="text-md font-bold text-indigo-400 mb-2">Autonomous Chain</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Observe the reactive flow in <span className="text-yellow-500">Analytics</span>. Peaks often correlate with multiple detected high-severity vulnerabilities before automated remediation agents flatten the curve.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-300">Signal Bus Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;


export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  ACTING = 'ACTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export type AgentRole = 'SECURITY' | 'REVIEWER' | 'COMPLIANCE' | 'REFACTOR' | 'PERFORMANCE' | 'INTEGRATION';

export enum TriggerType {
  CODE_SUBMITTED = 'CODE_SUBMITTED',
  VULNERABILITY_DETECTED = 'VULNERABILITY_DETECTED',
  INEFFICIENCY_DETECTED = 'INEFFICIENCY_DETECTED',
  SCHEMA_MISMATCH = 'SCHEMA_MISMATCH',
  REFACTOR_READY = 'REFACTOR_READY',
  REFACTOR_COMPLETE = 'REFACTOR_COMPLETE',
  BUILD_FAILED = 'BUILD_FAILED',
  DEPLOYMENT_STARTED = 'DEPLOYMENT_STARTED'
}

export interface TriggerEvent {
  id: string;
  type: TriggerType;
  source: string;
  timestamp: number;
  payload?: any;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  icon: string;
  subscriptions: TriggerType[];
}

export interface AnalysisResult {
  severity: 'high' | 'medium' | 'low' | 'info';
  issue: string;
  location: string;
  remediation: string;
  fixedCode?: string;
  suggestedTrigger?: TriggerType;
}

export interface WorkflowEvent {
  id: string;
  timestamp: number;
  agentId: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'trigger';
}

export interface RiskDataPoint {
  timestamp: number;
  score: number;
}

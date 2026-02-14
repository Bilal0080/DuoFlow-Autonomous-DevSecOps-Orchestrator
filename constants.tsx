
import React from 'react';
import { Agent, TriggerType } from './types';

export const AGENTS: Agent[] = [
  {
    id: 'sec-guard',
    name: 'SecGuard-V2',
    role: 'SECURITY',
    description: 'Proactively detects OWASP Top 10 risks including SQL Injection, Broken Access Control, and SSRF. Specialized in identifying hardcoded secrets and insecure cryptographic patterns.',
    icon: '🛡️',
    subscriptions: [TriggerType.CODE_SUBMITTED]
  },
  {
    id: 'code-scanner',
    name: 'CodeScanner',
    role: 'SECURITY',
    description: 'Deep-dives into lower-level code flaws such as memory safety violations, buffer overflows, and complex race conditions. Also triggered during build failures for deep diagnostics.',
    icon: '🔍',
    subscriptions: [TriggerType.VULNERABILITY_DETECTED, TriggerType.BUILD_FAILED]
  },
  {
    id: 'code-critic',
    name: 'CodeCritic',
    role: 'REVIEWER',
    description: 'Evaluates cognitive complexity and cyclomatic metrics. Ensures adherence to industry-standard style guides and identifies architectural "smells" like God objects or deep nesting.',
    icon: '🧐',
    subscriptions: [TriggerType.CODE_SUBMITTED]
  },
  {
    id: 'perf-optima',
    name: 'PerfOptima-X',
    role: 'PERFORMANCE',
    description: 'Algorithmic auditor focusing on Big O efficiency. Identifies redundant database queries (N+1), heavy synchronous operations on the main thread, and leaky closure patterns.',
    icon: '🚀',
    subscriptions: [TriggerType.CODE_SUBMITTED]
  },
  {
    id: 'risk-analyzer',
    name: 'RiskAnalyzer',
    role: 'PERFORMANCE',
    description: 'Calculates the reliability impact of changes on high-traffic critical paths. Detects fragile error handling, unhandled rejections, and potential cascading failures in distributed environments.',
    icon: '📉',
    subscriptions: [TriggerType.INEFFICIENCY_DETECTED]
  },
  {
    id: 'schema-guardian',
    name: 'SchemaGuardian',
    role: 'COMPLIANCE',
    description: 'Strict validator for OpenAPI and GraphQL contracts. Detects breaking changes in JSON structures, mismatched data types, and missing mandatory fields across service boundaries.',
    icon: '🧬',
    subscriptions: [TriggerType.SCHEMA_MISMATCH]
  },
  {
    id: 'refactor-engine',
    name: 'AutoRefactor',
    role: 'REFACTOR',
    description: 'Autonomous patch generator that converts security and performance findings into verified fixes. Specializes in transforming legacy callback hell into modern async/await patterns.',
    icon: '⚡',
    subscriptions: [TriggerType.VULNERABILITY_DETECTED, TriggerType.INEFFICIENCY_DETECTED, TriggerType.SCHEMA_MISMATCH]
  },
  {
    id: 'code-refactorer',
    name: 'CodeRefactorer',
    role: 'REFACTOR',
    description: 'Architectural modernization specialist. Orchestrates large-scale transformations like migrating from CommonJS to ES Modules. Invoked once code is pre-validated for refactoring.',
    icon: '✨',
    subscriptions: [TriggerType.REFACTOR_READY]
  },
  {
    id: 'cicd-integrator',
    name: 'CICDIntegrator',
    role: 'INTEGRATION',
    description: 'Pipeline orchestrator. Monitors build statuses and deployment events. Automatically triggers diagnostic agents upon build failure and manages canary release cycles.',
    icon: '🏗️',
    subscriptions: [TriggerType.CODE_SUBMITTED, TriggerType.REFACTOR_COMPLETE, TriggerType.BUILD_FAILED, TriggerType.DEPLOYMENT_STARTED]
  },
  {
    id: 'compliance-bot',
    name: 'AuditPro',
    role: 'COMPLIANCE',
    description: 'Regulated industry specialist (GDPR, HIPAA, SOC2). Verifies data PII masking, encryption-at-rest implementations, and generates mandatory audit-trail logs for every change.',
    icon: '📋',
    subscriptions: [TriggerType.REFACTOR_COMPLETE]
  },
  {
    id: 'compliance-master',
    name: 'ComplianceMaster',
    role: 'COMPLIANCE',
    description: 'Ensures adherence to industry regulations like GDPR, HIPAA, and SOC2 by analyzing code for data handling, encryption, and logging practices.',
    icon: '⚖️',
    subscriptions: [TriggerType.CODE_SUBMITTED, TriggerType.REFACTOR_COMPLETE]
  }
];

export const INITIAL_CODE_SAMPLE = `// Vulnerable Node.js / Express code example
const express = require('express');
const app = express();
const db = require('./database');

app.get('/user', (req, res) => {
  const query = "SELECT * FROM users WHERE id = '" + req.query.id + "'";
  db.query(query, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.listen(3000);`;

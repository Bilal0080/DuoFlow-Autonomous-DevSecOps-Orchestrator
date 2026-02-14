
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AgentRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Categorizes and transforms raw Gemini API errors into user-friendly, 
 * DevOps-centric status messages.
 */
function handleGeminiError(error: any, context: string): never {
  console.error(`Gemini Error [${context}]:`, error);
  
  const errString = String(error).toLowerCase();
  
  // Define error categories and their corresponding user messages
  const errorMap: Array<{ pattern: string | RegExp; message: string }> = [
    { 
      pattern: /401|403|api_key_invalid|unauthorized/i, 
      message: "AUTH_FAILURE: API key is invalid, expired, or lacks necessary permissions." 
    },
    { 
      pattern: /429|quota|rate limit/i, 
      message: "RESOURCE_EXHAUSTED: Gemini API rate limit reached. Throttling active." 
    },
    { 
      pattern: /safety|blocked|finish_reason_safety/i, 
      message: "POLICY_VIOLATION: Analysis aborted. Content flagged by safety filters." 
    },
    { 
      pattern: /fetch|network|dns|connection/i, 
      message: "NETWORK_ERROR: Failed to establish handshake with Google GenAI services." 
    },
    { 
      pattern: /500|503|unavailable|overloaded/i, 
      message: "SERVICE_UNAVAILABLE: Remote model is currently experiencing high latency or downtime." 
    },
    { 
      pattern: /token_limit|max_output_tokens/i, 
      message: "CAPACITY_ERROR: Response exceeded model token limits for the current context." 
    }
  ];

  for (const entry of errorMap) {
    if (typeof entry.pattern === 'string' ? errString.includes(entry.pattern) : entry.pattern.test(errString)) {
      throw new Error(entry.message);
    }
  }

  // Fallback for uncategorized errors
  throw new Error(`SYSTEM_FAULT: ${error.message || "An unexpected internal exception occurred."}`);
}

export async function runAgentAnalysis(role: AgentRole, code: string): Promise<string> {
  const roleInstructions: Record<AgentRole, string> = {
    SECURITY: "You are a senior Security Engineer. Analyze the code for vulnerabilities (SQLi, XSS, RCE, etc.). Focus on high-risk issues.",
    REVIEWER: "You are a meticulous Code Reviewer. Check for complexity, style violations, and potential bugs. Suggest improvements.",
    PERFORMANCE: "You are a Performance Engineer. Analyze the code for runtime bottlenecks, memory overhead, and inefficient loops. Suggest optimizations.",
    COMPLIANCE: "You are a Compliance Officer. Evaluate if the code handles data safely and follows standard corporate policies.",
    REFACTOR: "You are an expert Software Architect. Provide the final refactored, secure version of the code snippet based on the findings.",
    INTEGRATION: "You are a DevOps and Release Engineer. Analyze if the code changes are safe for the build pipeline and evaluate deployment readiness."
  };

  const model = role === 'REFACTOR' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { text: `${roleInstructions[role]}\n\nCODE TO ANALYZE:\n${code}` }
      ],
      config: {
        thinkingConfig: { thinkingBudget: role === 'REFACTOR' ? 2000 : 0 }
      }
    });

    if (!response.text) {
      throw new Error("EMPTY_RESPONSE: The model returned a null or empty completion.");
    }

    return response.text;
  } catch (error: any) {
    return handleGeminiError(error, `Analysis:${role}`);
  }
}

export async function parseStructuredFindings(rawAnalysis: string): Promise<AnalysisResult[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { text: `Extract a JSON list of vulnerabilities from this analysis text. Ensure output is valid JSON and strictly follows the schema:\n\n${rawAnalysis}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING, description: "high, medium, low, info" },
              issue: { type: Type.STRING },
              location: { type: Type.STRING },
              remediation: { type: Type.STRING },
              fixedCode: { type: Type.STRING }
            },
            required: ["severity", "issue", "remediation"]
          }
        }
      }
    });

    if (!response.text) {
      return [];
    }

    return JSON.parse(response.text.trim());
  } catch (error: any) {
    // We handle errors here too because this step also uses the API
    if (error.message?.includes('JSON')) {
       console.warn("PARSING_FAILURE: Could not convert model output to structured JSON.");
       return [];
    }
    // For other API-related errors during parsing, use the standard handler
    try {
      handleGeminiError(error, "StructuredParsing");
    } catch (e: any) {
      console.error(e.message);
      return [];
    }
    return [];
  }
}

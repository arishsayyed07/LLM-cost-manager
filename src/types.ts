/**
 * Types and Interfaces for the LLM Cost Monitoring Dashboard
 */

export interface QueryLog {
  id: string;
  timestamp: string; // ISO String
  prompt: string;
  response: string;
  model: string;
  department: string; // "Engineering" | "Customer Support" | "Marketing" | "Product" | "Personal (Chrome Extension)"
  user: string;
  promptTokens: number;
  responseTokens: number;
  cost: number; // in USD
  source: 'corporate' | 'extension';
  status: 'success' | 'error';
}

export interface BudgetConfig {
  department: string;
  monthlyLimit: number;
  currentSpend: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  type: 'warning' | 'critical';
  message: string;
  department: string;
  resolved: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedSavings: number; // in USD per month
  complexity: 'Low' | 'Medium' | 'High';
  category: 'Model Migration' | 'Response Caching' | 'Prompt Pruning' | 'Rate Limits';
}

export interface DashboardStats {
  totalSpend: number;
  totalQueries: number;
  avgCostPerQuery: number;
  totalTokens: number;
  corporateSpend: number;
  personalSpend: number;
}

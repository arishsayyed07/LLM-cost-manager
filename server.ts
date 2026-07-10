import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up data directory and file paths
const DATA_DIR = path.join(process.cwd(), "data");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");
const BUDGETS_FILE = path.join(DATA_DIR, "budgets.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Pricing per 1,000 tokens in USD
const PR_RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "claude-3-5-sonnet": { input: 0.003, output: 0.015 },
  "claude-3-5-haiku": { input: 0.0008, output: 0.004 },
  "gemini-3.1-pro-preview": { input: 0.00125, output: 0.00375 },
  "gemini-3.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-2.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-2.5-pro": { input: 0.00125, output: 0.00375 },
  "deepseek-v3": { input: 0.00014, output: 0.00028 },
  "deepseek-r1": { input: 0.00055, output: 0.00219 },
};

// Lazy initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Pre-seeded prompt and responses for realistic analytics
const SAMPLE_QUERIES = [
  {
    prompt: "Optimize this SQL query for high-throughput Postgres: SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100;",
    response: "To optimize this query, you should create a composite index on (user_id, created_at DESC). Also, instead of SELECT *, list only the required column names to reduce I/O and network overhead.",
    model: "claude-3-5-sonnet",
    department: "Engineering",
    user: "dev.sarah@enterprise.com",
    promptTokens: 450,
    responseTokens: 280,
  },
  {
    prompt: "Write 3 taglines for our new eco-friendly smart water bottle.",
    response: "1. Hydrate Smarter, Tread Lighter.\n2. Tech-forward Hydration for a Greener Tomorrow.\n3. Zero Waste. Pure Taste. Smarter Pace.",
    model: "gpt-4o",
    department: "Marketing",
    user: "marketer.alex@enterprise.com",
    promptTokens: 180,
    responseTokens: 90,
  },
  {
    prompt: "Draft a welcome email for new signups detailing their 14-day free trial limits.",
    response: "Subject: Welcome to CloudPlan! Your 14-Day Free Trial Starts Now...\n\nHi {{name}},\nWe're thrilled to have you! During your trial, you get access to all core features. Note that you have a soft quota of 500 API calls per day...",
    model: "gpt-3.5-turbo",
    department: "Customer Support",
    user: "support.jenny@enterprise.com",
    promptTokens: 120,
    responseTokens: 150,
  },
  {
    prompt: "Draft product requirements document outline for collaborative canvas feature.",
    response: "# PRD: Collaborative Canvas Feature\n\n## 1. Executive Summary\nReal-time collaborative workspace for architectural diagramming...\n\n## 2. User Stories\n- User A draws, User B sees changes instantly (< 100ms latency)...",
    model: "gemini-3.1-pro-preview",
    department: "Product",
    user: "prod.dan@enterprise.com",
    promptTokens: 600,
    responseTokens: 420,
  },
  {
    prompt: "Write a high-performance Python script to parse a 10GB Apache access log and aggregate 404 errors by IP.",
    response: "Here is a high-performance solution utilizing standard Python generator structures to stream the 10GB file without loading it all into memory, combined with collections.Counter:\n\n```python\nimport re\nfrom collections import Counter\n...\n```",
    model: "claude-3-5-sonnet",
    department: "Engineering",
    user: "dev.david@enterprise.com",
    promptTokens: 800,
    responseTokens: 650,
  },
  {
    prompt: "Translate this release log to Japanese and German.",
    response: "Here is the German translation:\n[German Version]\nHere is the Japanese translation:\n[Japanese Version]",
    model: "gemini-3.5-flash",
    department: "Product",
    user: "prod.dan@enterprise.com",
    promptTokens: 350,
    responseTokens: 500,
  }
];

const EXTENSION_QUERIES = [
  {
    prompt: "how to reverse a binary tree in rust?",
    response: "To invert a binary tree in Rust, you swap the left and right children recursively. Here is a clean implementation using Option<Box<TreeNode>>...",
    model: "gpt-4o",
    user: "personal-user@chrome-ext.com",
    promptTokens: 210,
    responseTokens: 340,
  },
  {
    prompt: "explain quantum entanglement to a five year old",
    response: "Imagine you have two magical socks that are twins. If you put one in a drawer in your bedroom, and take the other to your friend's house, and then spin the first sock to the left, the second sock spins to the left at the exact same time...",
    model: "claude-3-5-sonnet",
    user: "personal-user@chrome-ext.com",
    promptTokens: 90,
    responseTokens: 180,
  },
  {
    prompt: "quick recipe for chocolate chip cookies",
    response: "Ingredients: 1 cup butter, 1 cup sugar, 2 eggs, 3 cups flour, 1 tsp baking soda, 2 cups chocolate chips. Bake at 375°F (190°C) for 10 minutes.",
    model: "gemini-3.5-flash",
    user: "personal-user@chrome-ext.com",
    promptTokens: 80,
    responseTokens: 110,
  }
];

// Helper to seed logs spanning the last 15 days
function generateSeededLogs() {
  const seededLogs = [];
  const now = new Date();

  // Generate around 150 historical query logs
  for (let i = 0; i < 160; i++) {
    // Distribute across the last 15 days
    const dayOffset = Math.floor(Math.random() * 15);
    const logDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);

    const isExtension = Math.random() < 0.25; // 25% of logs from personal Chrome Extension
    let template;
    let department;
    let source: 'corporate' | 'extension';

    if (isExtension) {
      template = EXTENSION_QUERIES[Math.floor(Math.random() * EXTENSION_QUERIES.length)];
      department = "Personal (Chrome Extension)";
      source = "extension";
    } else {
      template = SAMPLE_QUERIES[Math.floor(Math.random() * SAMPLE_QUERIES.length)];
      department = template.department;
      source = "corporate";
    }

    // Add slight variations to tokens to avoid duplicate log lines
    const tokenMultiplier = 0.8 + Math.random() * 0.4; // 80% to 120%
    const promptTokens = Math.round(template.promptTokens * tokenMultiplier);
    const responseTokens = Math.round(template.responseTokens * tokenMultiplier);

    // Compute cost
    const rate = PR_RATES[template.model] || { input: 0.001, output: 0.003 };
    const cost = (promptTokens / 1000) * rate.input + (responseTokens / 1000) * rate.output;

    seededLogs.push({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: logDate.toISOString(),
      prompt: template.prompt,
      response: template.response,
      model: template.model,
      department: department,
      user: template.user,
      promptTokens: promptTokens,
      responseTokens: responseTokens,
      cost: Number(cost.toFixed(5)),
      source: source,
      status: 'success'
    });
  }

  // Sort logs by newest first
  seededLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return seededLogs;
}

// Initial Budgets setup
const DEFAULT_BUDGETS = [
  { department: "Engineering", monthlyLimit: 1200.00, currentSpend: 0 },
  { department: "Customer Support", monthlyLimit: 400.00, currentSpend: 0 },
  { department: "Marketing", monthlyLimit: 300.00, currentSpend: 0 },
  { department: "Product", monthlyLimit: 500.00, currentSpend: 0 },
  { department: "Personal (Chrome Extension)", monthlyLimit: 100.00, currentSpend: 0 }
];

// Read logs from persistence or seed if empty
function loadLogs(): any[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading logs file:", err);
  }
  
  // Seed logs and save
  const seeded = generateSeededLogs();
  saveLogs(seeded);
  return seeded;
}

function saveLogs(logs: any[]) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving logs file:", err);
  }
}

// Read budgets from persistence or load defaults
function loadBudgets(): any[] {
  try {
    if (fs.existsSync(BUDGETS_FILE)) {
      const data = fs.readFileSync(BUDGETS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading budgets file:", err);
  }

  // Use defaults and save
  saveBudgets(DEFAULT_BUDGETS);
  return DEFAULT_BUDGETS;
}

function saveBudgets(budgets: any[]) {
  try {
    fs.writeFileSync(BUDGETS_FILE, JSON.stringify(budgets, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving budgets file:", err);
  }
}

// Compute and update currentSpend inside budgets based on logs
function updateBudgetSpend(logs: any[], budgets: any[]): any[] {
  const updatedBudgets = budgets.map(b => {
    // Aggregate costs for this department in current month (assume all logs for now since they are preseeded for demo)
    const deptLogs = logs.filter(l => l.department === b.department && l.status === 'success');
    const totalSpend = deptLogs.reduce((sum, log) => sum + log.cost, 0);
    return {
      ...b,
      currentSpend: Number(totalSpend.toFixed(2))
    };
  });
  saveBudgets(updatedBudgets);
  return updatedBudgets;
}

// --- API ROUTES ---

// 1. Get logs, budgets, and computed stats
app.get("/api/dashboard", (req, res) => {
  const logs = loadLogs();
  const budgetsRaw = loadBudgets();
  const budgets = updateBudgetSpend(logs, budgetsRaw);

  // Compute stats
  const totalSpend = Number(logs.reduce((sum, l) => sum + l.cost, 0).toFixed(2));
  const totalQueries = logs.length;
  const avgCostPerQuery = totalQueries > 0 ? Number((totalSpend / totalQueries).toFixed(4)) : 0;
  const totalTokens = logs.reduce((sum, l) => sum + l.promptTokens + l.responseTokens, 0);
  
  const corporateLogs = logs.filter(l => l.source === 'corporate');
  const corporateSpend = Number(corporateLogs.reduce((sum, l) => sum + l.cost, 0).toFixed(2));
  
  const personalLogs = logs.filter(l => l.source === 'extension');
  const personalSpend = Number(personalLogs.reduce((sum, l) => sum + l.cost, 0).toFixed(2));

  // Auto-generate alerts based on budget thresholds (e.g. 80% warning, 100% critical)
  const alerts = [];
  for (const b of budgets) {
    const usageRatio = b.currentSpend / b.monthlyLimit;
    if (usageRatio >= 1.0) {
      alerts.push({
        id: `alert-critical-${b.department}`,
        timestamp: new Date().toISOString(),
        type: 'critical',
        message: `Budget CRITICAL: ${b.department} has spent $${b.currentSpend} of its $${b.monthlyLimit} limit!`,
        department: b.department,
        resolved: false
      });
    } else if (usageRatio >= 0.8) {
      alerts.push({
        id: `alert-warning-${b.department}`,
        timestamp: new Date().toISOString(),
        type: 'warning',
        message: `Budget WARNING: ${b.department} is at ${(usageRatio * 100).toFixed(0)}% of its limit ($${b.currentSpend} / $${b.monthlyLimit})`,
        department: b.department,
        resolved: false
      });
    }
  }

  res.json({
    logs,
    budgets,
    stats: {
      totalSpend,
      totalQueries,
      avgCostPerQuery,
      totalTokens,
      corporateSpend,
      personalSpend
    },
    alerts
  });
});

// 2. Chrome Extension Log ingest simulation
app.post("/api/logs", (req, res) => {
  const { prompt, response, model, promptTokens, responseTokens, department, user, source } = req.body;
  
  if (!prompt || !response || !model) {
    return res.status(400).json({ error: "Missing required fields: prompt, response, model" });
  }

  const resolvedSource = source || 'corporate';
  const resolvedDept = department || (resolvedSource === 'extension' ? "Personal (Chrome Extension)" : "Engineering");
  const resolvedUser = user || (resolvedSource === 'extension' ? "personal-user@chrome-ext.com" : "admin@enterprise.com");
  
  const pTokens = promptTokens || Math.round(prompt.length / 4);
  const rTokens = responseTokens || Math.round(response.length / 4);

  const rates = PR_RATES[model] || { input: 0.001, output: 0.003 };
  const cost = (pTokens / 1000) * rates.input + (rTokens / 1000) * rates.output;

  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    timestamp: new Date().toISOString(),
    prompt,
    response,
    model,
    department: resolvedDept,
    user: resolvedUser,
    promptTokens: pTokens,
    responseTokens: rTokens,
    cost: Number(cost.toFixed(5)),
    source: resolvedSource,
    status: 'success'
  };

  const logs = loadLogs();
  logs.unshift(newLog);
  saveLogs(logs);

  res.status(201).json(newLog);
});

// 3. Update Budgets
app.post("/api/budgets", (req, res) => {
  const { department, monthlyLimit } = req.body;
  if (!department || monthlyLimit === undefined) {
    return res.status(400).json({ error: "Missing required fields: department, monthlyLimit" });
  }

  let budgets = loadBudgets();
  budgets = budgets.map(b => {
    if (b.department === department) {
      return { ...b, monthlyLimit: Number(monthlyLimit) };
    }
    return b;
  });

  saveBudgets(budgets);
  res.json({ success: true, budgets });
});

// 4. Real Gemini Query Playground Route
app.post("/api/playground", async (req, res) => {
  const { prompt, department, user, model } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt field" });
  }

  const selectedModel = model || "gemini-3.5-flash";
  const selectedDept = department || "Engineering";
  const selectedUser = user || "playground.user@enterprise.com";

  try {
    const ai = getGeminiClient();
    
    // Choose actual execution model for Gemini SDK
    let apiModel = "gemini-2.5-flash"; // Default excellent model
    if (selectedModel === "gemini-2.5-pro") {
      apiModel = "gemini-2.5-pro";
    } else if (selectedModel === "gemini-3.5-flash") {
      apiModel = "gemini-2.5-flash"; 
    } else if (selectedModel === "gemini-3.1-pro-preview") {
      apiModel = "gemini-2.5-pro";
    }

    // Call real Gemini API
    const response = await ai.models.generateContent({
      model: apiModel,
      contents: prompt,
    });

    const textResponse = response.text || "No text response generated.";

    // Track real prompt + response and calculate simulated token counts/prices
    const promptTokens = Math.round(prompt.length / 3.8) + 8;
    const responseTokens = Math.round(textResponse.length / 3.8) + 12;

    const rates = PR_RATES[selectedModel] || PR_RATES["gemini-3.5-flash"];
    const cost = (promptTokens / 1000) * rates.input + (responseTokens / 1000) * rates.output;

    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      timestamp: new Date().toISOString(),
      prompt,
      response: textResponse,
      model: selectedModel,
      department: selectedDept,
      user: selectedUser,
      promptTokens,
      responseTokens,
      cost: Number(cost.toFixed(5)),
      source: 'corporate',
      status: 'success'
    };

    const logs = loadLogs();
    logs.unshift(newLog);
    saveLogs(logs);

    res.json({
      success: true,
      log: newLog
    });
  } catch (error: any) {
    console.error("Playground query failed:", error);
    
    // Create an error log
    const failedLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      timestamp: new Date().toISOString(),
      prompt,
      response: `ERROR: ${error.message || "Failed to contact API"}`,
      model: selectedModel,
      department: selectedDept,
      user: selectedUser,
      promptTokens: Math.round(prompt.length / 4),
      responseTokens: 0,
      cost: 0,
      source: 'corporate',
      status: 'error'
    };

    const logs = loadLogs();
    logs.unshift(failedLog);
    saveLogs(logs);

    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong during the playground query.",
      log: failedLog
    });
  }
});

// 5. Intelligent Gemini-powered Cost Optimization Engine
app.get("/api/optimize", async (req, res) => {
  try {
    const logs = loadLogs();
    const budgets = loadBudgets();
    
    // Prepare a condensed summary of current usage for Gemini to analyze
    // to fit within token guidelines and keep it fast
    const logsSample = logs.slice(0, 40).map(l => ({
      dept: l.department,
      model: l.model,
      promptLen: l.prompt.length,
      respLen: l.response.length,
      pTok: l.promptTokens,
      rTok: l.responseTokens,
      cost: l.cost
    }));

    const budgetsSummary = budgets.map(b => ({
      dept: b.department,
      limit: b.monthlyLimit,
      spend: b.currentSpend
    }));

    const promptText = `
You are a highly advanced AI Cost Optimization Analyst specializing in LLM expenses (OpenAI, Gemini, Anthropic).
Analyze the following corporate LLM API usage logs and budget guidelines:

Budgets:
${JSON.stringify(budgetsSummary, null, 2)}

Sample Logs:
${JSON.stringify(logsSample, null, 2)}

Identify where waste is occurring. Focus on these concepts:
- Is a department using an expensive model (gpt-4o, claude-3-5-sonnet) for tasks with low complexity or short response requirements?
- Are budgets near exhaustion?
- Suggest migrations to more cost-effective models (like gemini-3.5-flash or gpt-3.5-turbo).
- Suggest enabling semantic caching, rate limiting, or prompt compression.

You MUST respond strictly with a valid JSON array of structured recommendations. Do NOT include markdown wrap, just the raw array of objects.
Each object in the array must strictly have these fields:
- id: string (unique string, e.g. "opt-01")
- title: string (concise actionable headline)
- description: string (detailed, citing specific departments/models from the data)
- estimatedSavings: number (realistic estimated monthly savings in USD, e.g., 240)
- complexity: "Low" | "Medium" | "High"
- category: "Model Migration" | "Response Caching" | "Prompt Pruning" | "Rate Limits"

Example structure:
[
  {
    "id": "opt-1",
    "title": "Migrate Support Chatbot to Gemini 1.5 Flash",
    "description": "Customer Support is using GPT-4o for repetitive simple queries, costing $0.15/call. Switching to gemini-3.5-flash would save up to 92% per query with equal performance.",
    "estimatedSavings": 250,
    "complexity": "Low",
    "category": "Model Migration"
  }
]
`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json"
      }
    });

    let suggestionsStr = response.text || "[]";
    // Sanitize any occasional markdown JSON fences
    suggestionsStr = suggestionsStr.replace(/```json/g, "").replace(/```/g, "").trim();

    const suggestions = JSON.parse(suggestionsStr);
    res.json({ success: true, suggestions });

  } catch (error: any) {
    console.error("AI Cost optimization failed:", error);
    
    // Provide clean, realistic static suggestions if the API key is not yet configured or fails
    const staticSuggestions = [
      {
        id: "opt-static-1",
        title: "Migrate Engineering coding queries to Gemini 1.5 Flash",
        description: "Analysis shows Engineering is using Claude 3.5 Sonnet for trivial documentation checks. Moving these secondary workflows to Gemini 1.5 Flash will reduce prompt token costs by up to 95%.",
        estimatedSavings: 180,
        complexity: "Low",
        category: "Model Migration"
      },
      {
        id: "opt-static-2",
        title: "Enable Response Caching for Customer Support",
        description: "We detected 22% duplicate greetings and simple onboarding queries in Customer Support. Implementing local Redis caching on identical prompts would eliminate $85/month in redundant API charges.",
        estimatedSavings: 85,
        complexity: "Medium",
        category: "Response Caching"
      },
      {
        id: "opt-static-3",
        title: "Enforce strict Rate Limits on Marketing copywriting bots",
        description: "Marketing has several recurring automated scheduled social media script runs that query GPT-4o at high concurrency, approaching their monthly budget. Placing user-based hourly token budgets will prevent unexpected overruns.",
        estimatedSavings: 120,
        complexity: "Medium",
        category: "Rate Limits"
      },
      {
        id: "opt-static-4",
        title: "Prune long contextual system instructions in Product translations",
        description: "System instructions in the Product localization pipeline contain 1,500 redundant tokens of styling guidelines. Compressing this prompt context down to 300 tokens can save approximately $140/month.",
        estimatedSavings: 140,
        complexity: "Low",
        category: "Prompt Pruning"
      }
    ];

    res.json({
      success: false,
      message: error.message || "Failed to contact Gemini for dynamic analysis. Showing built-in recommendation intelligence.",
      suggestions: staticSuggestions
    });
  }
});

// 6. Reset dataset
app.post("/api/reset", (req, res) => {
  const seededLogs = generateSeededLogs();
  saveLogs(seededLogs);
  saveBudgets(DEFAULT_BUDGETS);
  res.json({ success: true, message: "Dataset successfully reset to rich default history." });
});


// Serve Vite or static assets depending on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LLM Cost Monitoring Server running on port ${PORT}`);
  });
}

startServer();

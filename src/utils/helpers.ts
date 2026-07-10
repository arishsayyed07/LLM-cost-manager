export const formatUSD = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: val < 1 && val > 0 ? 5 : 2
  }).format(val);
};

export const formatInt = (val: number): string => {
  return new Intl.NumberFormat('en-US').format(val);
};

export const formatPercent = (val: number): string => {
  return `${(val * 100).toFixed(0)}%`;
};

export const MODEL_CONFIGS: Record<string, { name: string; short: string; color: string; bg: string; border: string; provider: string }> = {
  "gpt-4o": { 
    name: "OpenAI GPT-4o", 
    short: "GPT-4o",
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/20",
    provider: "OpenAI"
  },
  "gpt-4o-mini": { 
    name: "OpenAI GPT-4o Mini", 
    short: "GPT-4o Mini",
    color: "text-emerald-500", 
    bg: "bg-emerald-600/10", 
    border: "border-emerald-600/20",
    provider: "OpenAI"
  },
  "gpt-3.5-turbo": { 
    name: "OpenAI GPT-3.5 Turbo", 
    short: "GPT-3.5",
    color: "text-green-400", 
    bg: "bg-green-500/10", 
    border: "border-green-500/20",
    provider: "OpenAI"
  },
  "claude-3-5-sonnet": { 
    name: "Anthropic Claude 3.5 Sonnet", 
    short: "Claude 3.5 Sonnet",
    color: "text-amber-500", 
    bg: "bg-amber-500/10", 
    border: "border-amber-500/20",
    provider: "Anthropic"
  },
  "claude-3-5-haiku": { 
    name: "Anthropic Claude 3.5 Haiku", 
    short: "Claude 3.5 Haiku",
    color: "text-orange-400", 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/20",
    provider: "Anthropic"
  },
  "gemini-3.1-pro-preview": { 
    name: "Gemini 1.5 Pro", 
    short: "Gemini 1.5 Pro",
    color: "text-cyan-400", 
    bg: "bg-cyan-500/10", 
    border: "border-cyan-500/20",
    provider: "Google"
  },
  "gemini-3.5-flash": { 
    name: "Gemini 1.5 Flash", 
    short: "Gemini 1.5 Flash",
    color: "text-indigo-400", 
    bg: "bg-indigo-500/10", 
    border: "border-indigo-500/20",
    provider: "Google"
  },
  "gemini-2.5-flash": { 
    name: "Gemini 2.5 Flash (Latest)", 
    short: "Gemini 2.5 Flash",
    color: "text-blue-400", 
    bg: "bg-blue-500/10", 
    border: "border-blue-500/20",
    provider: "Google"
  },
  "gemini-2.5-pro": { 
    name: "Gemini 2.5 Pro (Latest)", 
    short: "Gemini 2.5 Pro",
    color: "text-purple-400", 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/20",
    provider: "Google"
  },
  "deepseek-v3": { 
    name: "DeepSeek V3", 
    short: "DeepSeek V3",
    color: "text-rose-400", 
    bg: "bg-rose-500/10", 
    border: "border-rose-500/20",
    provider: "DeepSeek"
  },
  "deepseek-r1": { 
    name: "DeepSeek R1 (Reasoning)", 
    short: "DeepSeek R1",
    color: "text-red-500", 
    bg: "bg-red-500/10", 
    border: "border-red-500/20",
    provider: "DeepSeek"
  }
};

export const DEPT_CONFIGS: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  "Engineering": {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "code"
  },
  "Customer Support": {
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    icon: "headphones"
  },
  "Marketing": {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "megaphone"
  },
  "Product": {
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    icon: "box"
  },
  "Personal (Chrome Extension)": {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "chrome"
  }
};

import type { ModelInfo } from '../types';

export const MODELS: ModelInfo[] = [
  // Flagship Cloud
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', category: 'cloud', tier: 'flagship', contextWindow: 1048576, description: 'Latest flagship from OpenAI' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', category: 'cloud', tier: 'flagship', contextWindow: 200000, description: 'Anthropic latest balanced model' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', category: 'cloud', tier: 'flagship', contextWindow: 200000, description: 'Anthropic most capable model' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'Google', category: 'cloud', tier: 'flagship', contextWindow: 1048576, description: 'Google flagship with huge context' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', category: 'cloud', tier: 'flagship', contextWindow: 164000, description: 'Reasoning-focused model' },
  { id: 'x-ai/grok-3', name: 'Grok 3', provider: 'xAI', category: 'cloud', tier: 'flagship', contextWindow: 131072, description: 'xAI flagship model' },

  // Mid Cloud
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', category: 'cloud', tier: 'mid', contextWindow: 1048576, description: 'Fast and affordable GPT-4 class' },
  { id: 'anthropic/claude-haiku-3.5', name: 'Claude Haiku 3.5', provider: 'Anthropic', category: 'cloud', tier: 'mid', contextWindow: 200000, description: 'Fast Anthropic model' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', category: 'cloud', tier: 'mid', contextWindow: 1048576, description: 'Fast Google model' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', category: 'cloud', tier: 'mid', contextWindow: 128000, description: 'Previous gen fast model' },

  // Budget Cloud
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', category: 'cloud', tier: 'budget', contextWindow: 1048576, description: 'Cheapest OpenAI option' },
  { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini Flash Lite', provider: 'Google', category: 'cloud', tier: 'budget', contextWindow: 1048576, description: 'Cheapest Google option' },

  // Local-capable (open-weight models available on OpenRouter)
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', provider: 'Qwen', category: 'local', tier: 'flagship', contextWindow: 131072, description: 'Top open-weight MoE model' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', category: 'local', tier: 'flagship', contextWindow: 1048576, description: 'Meta latest open model' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', provider: 'Meta', category: 'local', tier: 'mid', contextWindow: 512000, description: 'Meta efficient model' },
  { id: 'qwen/qwen3-30b-a3b', name: 'Qwen3 30B', provider: 'Qwen', category: 'local', tier: 'mid', contextWindow: 131072, description: 'Efficient open MoE model' },
  { id: 'mistralai/mistral-small-3.2-24b-instruct', name: 'Mistral Small 3.2', provider: 'Mistral', category: 'local', tier: 'mid', contextWindow: 128000, description: 'Strong small open model' },
  { id: 'qwen/qwen3-8b', name: 'Qwen3 8B', provider: 'Qwen', category: 'local', tier: 'budget', contextWindow: 131072, description: 'Small open model, runs locally' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', category: 'local', tier: 'budget', contextWindow: 131072, description: 'Compact Meta model' },
  { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', provider: 'Google', category: 'local', tier: 'budget', contextWindow: 131072, description: 'Small Google open model' },
];

export const MODEL_CATEGORIES = {
  cloud: { label: 'Cloud Models', description: 'Hosted by providers, highest capability' },
  local: { label: 'Open-Weight / Local', description: 'Can run locally or via OpenRouter' },
};

export const MODEL_TIERS = {
  flagship: { label: 'Flagship', color: '#f59e0b' },
  mid: { label: 'Mid-Tier', color: '#3b82f6' },
  budget: { label: 'Budget', color: '#22c55e' },
};

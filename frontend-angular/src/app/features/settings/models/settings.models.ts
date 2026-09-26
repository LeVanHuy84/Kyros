export interface AiConfig {
  provider: string; // 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'DEEPSEEK' | 'OPENROUTER' | 'GROQ' | 'XAI' | 'MISTRAL' | 'TOGETHER' | 'COHERE' | 'PERPLEXITY' | 'OLLAMA' | 'LOCAL' | 'CUSTOM'
  apiKey?: string;
  hasSavedKey: boolean;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AiPreset {
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  category: string;
  popularModels?: string[];
  description?: string;
}

export const AI_PRESETS: Record<string, AiPreset> = {
  gemini: {
    name: 'Google Gemini (Flash / Pro)',
    provider: 'GEMINI',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.0-flash',
    category: 'Cloud Providers',
    popularModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-pro-exp-02-05'],
    description: 'Mô hình đa phương thức tốc độ cao của Google với context window siêu lớn',
  },
  openai: {
    name: 'OpenAI (GPT-4o / o1 / o3)',
    provider: 'OPENAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    category: 'Cloud Providers',
    popularModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1', 'gpt-4-turbo'],
    description: 'Chuẩn mô hình OpenAI GPT thông minh và đa dụng',
  },
  anthropic: {
    name: 'Anthropic Claude (Sonnet / Haiku)',
    provider: 'ANTHROPIC',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-7-sonnet-20250219',
    category: 'Cloud Providers',
    popularModels: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    description: 'Tư duy lập trình và phân tích văn bản hàng đầu từ Anthropic',
  },
  deepseek: {
    name: 'DeepSeek (V3 / R1 Reasoning)',
    provider: 'DEEPSEEK',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    category: 'Cloud Providers',
    popularModels: ['deepseek-chat', 'deepseek-reasoner'],
    description: 'Mô hình DeepSeek V3 và R1 Reasoning mã nguồn mở chi phí tối ưu',
  },
  openrouter: {
    name: 'OpenRouter (All-in-One Gateway)',
    provider: 'OPENROUTER',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-r1',
    category: 'Aggregators & Gateways',
    popularModels: [
      'deepseek/deepseek-r1',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.7-sonnet',
      'openai/gpt-4o',
      'meta-llama/llama-3.3-70b-instruct',
      'qwen/qwen-2.5-72b-instruct',
    ],
    description: 'Cổng kết nối hơn 200+ mô hình AI toàn cầu chỉ với 1 API Key duy nhất',
  },
  groq: {
    name: 'Groq (Ultra-Fast Inference)',
    provider: 'GROQ',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    category: 'Ultra-Fast Inference',
    popularModels: [
      'llama-3.3-70b-versatile',
      'deepseek-r1-distill-llama-70b',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    description: 'Tốc độ phản hồi cực nhanh trên phần cứng LPU chuyên dụng',
  },
  xai: {
    name: 'xAI / Grok',
    provider: 'XAI',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2-latest',
    category: 'Cloud Providers',
    popularModels: ['grok-2-latest', 'grok-2-vision-1212', 'grok-beta'],
    description: 'Mô hình Grok từ xAI với hiểu biết thực tế sâu rộng',
  },
  mistral: {
    name: 'Mistral AI (Large / Codestral)',
    provider: 'MISTRAL',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-large-latest',
    category: 'Cloud Providers',
    popularModels: ['mistral-large-latest', 'codestral-latest', 'mistral-small-latest'],
    description: 'Mô hình Châu Âu hàng đầu với Codestral chuyên viết mã',
  },
  together: {
    name: 'Together AI',
    provider: 'TOGETHER',
    baseUrl: 'https://api.together.xyz/v1',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    category: 'Ultra-Fast Inference',
    popularModels: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'deepseek-ai/DeepSeek-R1',
      'deepseek-ai/DeepSeek-V3',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
    ],
    description: 'Hạ tầng điện toán đám mây cho các mô hình mã nguồn mở',
  },
  cohere: {
    name: 'Cohere (Command R+)',
    provider: 'COHERE',
    baseUrl: 'https://api.cohere.com/v2',
    model: 'command-r-plus-08-2024',
    category: 'Cloud Providers',
    popularModels: ['command-r-plus-08-2024', 'command-r-08-2024'],
    description: 'Mô hình doanh nghiệp chuyên tối ưu hóa truy xuất và thực thi lệnh',
  },
  perplexity: {
    name: 'Perplexity AI (Sonar)',
    provider: 'PERPLEXITY',
    baseUrl: 'https://api.perplexity.ai',
    model: 'sonar-pro',
    category: 'Cloud Providers',
    popularModels: ['sonar-pro', 'sonar', 'sonar-reasoning', 'sonar-reasoning-pro'],
    description: 'Mô hình tìm kiếm và tổng hợp thông tin trực tuyến thời gian thực',
  },
  ollama: {
    name: 'Ollama (Local AI on PC)',
    provider: 'OLLAMA',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.3:latest',
    category: 'Local / Self-Hosted',
    popularModels: ['llama3.3:latest', 'deepseek-r1:8b', 'deepseek-r1:14b', 'qwen2.5-coder:7b', 'phi4:latest', 'mistral:latest'],
    description: 'Chạy mô hình hoàn toàn cục bộ trên máy tính cá nhân, bảo mật 100% không qua Internet',
  },
  lmstudio: {
    name: 'LM Studio / LocalAI / vLLM',
    provider: 'LOCAL',
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
    category: 'Local / Self-Hosted',
    popularModels: ['local-model', 'default'],
    description: 'Kết nối máy chủ AI cục bộ qua chuẩn OpenAI API',
  },
  custom: {
    name: 'Custom OpenAI-Compatible Gateway',
    provider: 'CUSTOM',
    baseUrl: 'https://your-custom-ai-proxy.com/v1',
    model: 'custom-model',
    category: 'Custom / Proxy',
    popularModels: [],
    description: 'Cấu hình endpoint tùy chỉnh, proxy nội bộ hoặc API Gateway riêng của doanh nghiệp',
  },
};


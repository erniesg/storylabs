import { RealtimeClient } from '@openai/realtime-api-beta';

interface OpenAIConfig {
  apiKey?: string;
  serverUrl?: string;
}

class OpenAIService {
  private static instance: OpenAIService;
  private client: RealtimeClient | null = null;

  private constructor() {}

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async initialize(config: OpenAIConfig) {
    if (this.client) {
      await this.client.disconnect();
    }

    this.client = new RealtimeClient(
      config.serverUrl
        ? { url: config.serverUrl }
        : {
            apiKey: config.apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    );

    await this.client.connect();

    // Configure default session settings for TTS
    this.client.updateSession({
      modalities: ['text', 'audio'],
      output_audio_format: 'pcm16',
    });

    return this.client;
  }

  getClient(): RealtimeClient {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}

// Export singleton instance
export const openAIService = OpenAIService.getInstance();

// Helper function to get initialized client
export async function getOpenAIClient(config: OpenAIConfig): Promise<RealtimeClient> {
  const service = OpenAIService.getInstance();
  if (!service.getClient()) {
    await service.initialize(config);
  }
  return service.getClient();
}
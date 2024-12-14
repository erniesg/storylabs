import { RealtimeClient } from '@openai/realtime-api-beta';

interface OpenAIConfig {
  apiKey?: string;
  serverUrl?: string;
}

class OpenAIService {
  private static instance: OpenAIService;
  private client: RealtimeClient | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<RealtimeClient> | null = null;

  private constructor() {}

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async initialize(config: OpenAIConfig): Promise<RealtimeClient> {
    if (this.isInitializing) {
      return this.initPromise!;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // Disconnect existing client if any
        if (this.client) {
          await this.client.disconnect();
        }

        // Create new client
        this.client = new RealtimeClient(
          config.serverUrl
            ? { url: config.serverUrl }
            : {
                apiKey: config.apiKey,
                dangerouslyAllowAPIKeyInBrowser: true,
              }
        );

        // Connect and configure
        await this.client.connect();
        
        // Configure default session settings for TTS
        this.client.updateSession({
          modalities: ['text', 'audio'],
          output_audio_format: 'pcm16',
          turn_detection: null, // Disable VAD since we're not doing continuous voice input
        });

        return this.client;
      } catch (error) {
        this.client = null;
        throw error;
      } finally {
        this.isInitializing = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  getClient(): RealtimeClient {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client?.isConnected() || false;
  }
}

// Export singleton instance
export const openAIService = OpenAIService.getInstance();

// Helper function to get initialized client
export async function getOpenAIClient(config: OpenAIConfig): Promise<RealtimeClient> {
  const service = OpenAIService.getInstance();
  
  // If client exists and is connected, return it
  if (service.isConnected()) {
    return service.getClient();
  }

  // Initialize new client
  return service.initialize(config);
}
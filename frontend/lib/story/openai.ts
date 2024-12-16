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

        // Create new client with proper configuration
        this.client = new RealtimeClient({
          apiKey: config.apiKey,
          dangerouslyAllowAPIKeyInBrowser: true,
          url: config.serverUrl || 'wss://api.openai.com/v1/realtime'
        });

        console.log('Attempting to connect to OpenAI Realtime API...');

        // Connect to the service
        await this.client.connect();
        
        console.log('Successfully connected to OpenAI Realtime API');

        // Configure default session settings
        await this.client.updateSession({
          modalities: ['text', 'audio'],
          output_audio_format: 'pcm16',
          turn_detection: null, // Disable VAD since we're not doing continuous voice input
        });

        console.log('Session settings updated successfully');

        return this.client;
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
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
      try {
        await this.client.disconnect();
        console.log('Successfully disconnected from OpenAI Realtime API');
      } catch (error) {
        console.error('Error disconnecting from OpenAI:', error);
      } finally {
        this.client = null;
      }
    }
  }

  isConnected(): boolean {
    try {
      return this.client?.isConnected() || false;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  }

  // Add method to check API key validity
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const tempClient = new RealtimeClient({
        apiKey,
        dangerouslyAllowAPIKeyInBrowser: true,
        url: 'wss://api.openai.com/v1/realtime'
      });

      await tempClient.connect();
      await tempClient.disconnect();
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openAIService = OpenAIService.getInstance();

// Helper function to get initialized client
export async function getOpenAIClient(config: OpenAIConfig): Promise<RealtimeClient> {
  if (!config.apiKey && !config.serverUrl) {
    throw new Error('Either apiKey or serverUrl must be provided');
  }

  const service = OpenAIService.getInstance();
  
  // If client exists and is connected, return it
  if (service.isConnected()) {
    return service.getClient();
  }

  // Initialize new client
  try {
    console.log('Initializing new OpenAI client...');
    const client = await service.initialize(config);
    console.log('OpenAI client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to get OpenAI client:', error);
    throw error;
  }
}

// Export types for use in other files
export type { OpenAIConfig };
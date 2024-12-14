import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavStreamPlayer } from '../wavtools/lib/wav_stream_player';
import { openAIService } from '../openai';
import type { ParsedScene } from './SceneParser';

interface AudioEvent {
  id: string;
  audio: Int16Array;
  text: string;
  status: 'pending' | 'playing' | 'complete';
}

interface SequencerOptions {
  apiKey?: string;
  serverUrl?: string;
}

export class StorySequencer {
  private client: RealtimeClient;
  private player: WavStreamPlayer;
  private currentScene?: ParsedScene;
  private audioEvents: Map<string, AudioEvent> = new Map();
  private isProcessing: boolean = false;

  constructor(options: SequencerOptions) {
    // Initialize RealtimeClient similar to ConsolePage example
    this.client = new RealtimeClient(
      options.serverUrl
        ? { url: options.serverUrl }
        : {
            apiKey: options.apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    );

    // Initialize audio player
    this.player = new WavStreamPlayer({ sampleRate: 24000 });

    // Set up client event handlers
    this.setupClientHandlers();
  }

  private setupClientHandlers() {
    // Handle audio generation events
    this.client.on('conversation.updated', async ({ item, delta }) => {
      if (delta?.audio) {
        const audioEvent = this.audioEvents.get(item.id);
        if (audioEvent) {
          // Merge new audio data with existing
          audioEvent.audio = new Int16Array([...audioEvent.audio, ...delta.audio]);
          this.audioEvents.set(item.id, audioEvent);
        }
      }
    });

    // Handle completion events
    this.client.on('conversation.item.completed', ({ item }) => {
      const audioEvent = this.audioEvents.get(item.id);
      if (audioEvent) {
        audioEvent.status = 'complete';
        this.audioEvents.set(item.id, audioEvent);
      }
    });
  }

  public async connect(): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
      await this.player.connect();

      // Configure session for TTS
      this.client.updateSession({
        modalities: ['text', 'audio'],
        output_audio_format: 'pcm16',
      });
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.player.interrupt();
      this.client.disconnect();
    }
  }

  public async loadScene(scene: ParsedScene): Promise<void> {
    this.currentScene = scene;
    this.audioEvents.clear();
    
    // Pre-initialize audio events
    for (const event of scene.events) {
      this.audioEvents.set(event.id, {
        id: event.id,
        audio: new Int16Array(),
        text: event.text,
        status: 'pending'
      });
    }
  }

  public async processNextEvent(): Promise<AudioEvent | null> {
    if (!this.currentScene || this.isProcessing) return null;

    const pendingEvent = this.currentScene.events.find(event => 
      this.audioEvents.get(event.id)?.status === 'pending'
    );

    if (!pendingEvent) return null;

    this.isProcessing = true;
    const audioEvent = this.audioEvents.get(pendingEvent.id)!;

    try {
      // Configure voice based on character
      if (pendingEvent.character) {
        this.client.updateSession({
          voice: pendingEvent.character.voice,
        });
      }

      // Generate speech with appropriate emotion/style
      let prompt = pendingEvent.text;
      if (pendingEvent.emotion) {
        prompt = `[${pendingEvent.emotion}] ${prompt}`;
      }

      // Send the text for TTS generation
      this.client.sendUserMessageContent([
        {
          type: 'input_text',
          text: prompt,
        },
      ]);

      // Wait for completion
      const { item } = await this.client.waitForNextCompletedItem();
      
      if (item.formatted.audio) {
        audioEvent.audio = item.formatted.audio;
        audioEvent.status = 'complete';
        this.audioEvents.set(pendingEvent.id, audioEvent);
      }

      return audioEvent;
    } catch (error) {
      console.error('Error processing audio event:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  public async playEvent(eventId: string): Promise<void> {
    const audioEvent = this.audioEvents.get(eventId);
    if (!audioEvent || audioEvent.status !== 'complete') return;

    audioEvent.status = 'playing';
    this.audioEvents.set(eventId, audioEvent);

    try {
      await this.player.playPCM(audioEvent.audio);
      audioEvent.status = 'complete';
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      this.audioEvents.set(eventId, audioEvent);
    }
  }

  public async replayEvent(eventId: string): Promise<void> {
    const audioEvent = this.audioEvents.get(eventId);
    if (!audioEvent || audioEvent.status !== 'complete') return;

    await this.playEvent(eventId);
  }

  public getEventStatus(eventId: string): 'pending' | 'playing' | 'complete' | null {
    return this.audioEvents.get(eventId)?.status || null;
  }

  public getAllEvents(): AudioEvent[] {
    return Array.from(this.audioEvents.values());
  }
}
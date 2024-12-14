import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavStreamPlayer } from '../wavtools/lib/wav_stream_player';
import { WavRecorder } from '../wavtools/lib/wav_recorder';
import type { ParsedScene, StoryEvent } from './SceneParser';
import { getOpenAIClient } from './openai';

interface AudioEvent {
  id: string;
  text: string;
  status: 'pending' | 'playing' | 'complete';
  file?: Blob;  // For storing decoded WAV file
}

interface SequencerOptions {
  apiKey?: string;
  serverUrl?: string;
}

export class StorySequencer {
  private client: RealtimeClient;
  public player: WavStreamPlayer;
  private currentScene?: ParsedScene;
  private audioEvents: Map<string, AudioEvent> = new Map();
  private isProcessing: boolean = false;
  private currentEventId?: string;
  private readonly options: SequencerOptions;

  constructor(options: SequencerOptions) {
    this.options = options;
    this.player = new WavStreamPlayer({ sampleRate: 24000 });
    this.client = null!; // Will be initialized in connect()
  }

  private setupClientHandlers() {
    // Handle streaming audio data and completion
    this.client.on('conversation.updated', async ({ item, delta }) => {
      console.log('Audio update received:', { 
        hasAudio: !!delta?.audio, 
        itemId: item.id, 
        currentId: this.currentEventId,
        status: item.status
      });

      if (delta?.audio && item.id === this.currentEventId) {
        console.log('Streaming audio chunk:', delta.audio.length);
        // Stream audio directly to player as it comes in
        this.player.add16BitPCM(delta.audio, item.id);
      }

      // When completed, decode the full audio and store as WAV
      if (item.status === 'completed' && item.formatted.audio?.length) {
        console.log('Audio completed:', {
          length: item.formatted.audio.length,
          itemId: item.id
        });
        
        const audioEvent = this.audioEvents.get(item.id);
        if (audioEvent) {
          const decodedAudio = await WavRecorder.decode(
            item.formatted.audio,
            24000,
            24000
          );
          
          // Store the decoded WAV blob directly
          audioEvent.file = decodedAudio.blob;
          audioEvent.status = 'complete';
          this.audioEvents.set(item.id, audioEvent);
          this.currentEventId = undefined;
          this.isProcessing = false;
        }
      }
    });

    // Handle interruptions
    this.client.on('conversation.interrupted', async () => {
      console.log('Conversation interrupted');
      const trackSampleOffset = await this.player.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await this.client.cancelResponse(trackId, offset);
      }
      this.isProcessing = false;
      this.currentEventId = undefined;
    });

    // Handle errors
    this.client.on('error', (error: any) => {
      console.error('RealtimeClient error:', error);
      this.isProcessing = false;
      this.currentEventId = undefined;
    });
  }

  public async connect(): Promise<void> {
    try {
      console.log('Connecting StorySequencer with options:', this.options);
      // Get client from singleton service
      this.client = await getOpenAIClient({
        apiKey: this.options.apiKey,
        serverUrl: this.options.serverUrl
      });

      // Connect audio player
      await this.player.connect();
      console.log('StorySequencer connected successfully');

      // Set up event handlers
      this.setupClientHandlers();
    } catch (error) {
      console.error('Failed to connect StorySequencer:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.player.interrupt();
  }

  public async loadScene(scene: ParsedScene): Promise<void> {
    console.log('Loading scene:', scene);
    this.currentScene = scene;
    this.audioEvents.clear();
    this.currentEventId = undefined;
    this.isProcessing = false;
    
    // Pre-initialize audio events
    for (const event of scene.events) {
      this.audioEvents.set(event.id, {
        id: event.id,
        text: event.text,
        status: 'pending'
      });
    }
    console.log('Scene loaded, events initialized:', this.audioEvents.size);
  }

  public async processNextEvent(): Promise<AudioEvent | null> {
    if (!this.currentScene || this.isProcessing || this.currentEventId) {
      console.log('Cannot process next event:', { 
        hasScene: !!this.currentScene, 
        isProcessing: this.isProcessing, 
        currentEventId: this.currentEventId 
      });
      return null;
    }

    const pendingEvent = this.currentScene.events.find(event => 
      this.audioEvents.get(event.id)?.status === 'pending'
    );

    if (!pendingEvent) {
      console.log('No pending events found');
      return null;
    }

    console.log('Processing event:', pendingEvent);
    this.isProcessing = true;
    this.currentEventId = pendingEvent.id;
    const audioEvent = this.audioEvents.get(pendingEvent.id)!;

    try {
      switch (pendingEvent.type) {
        case 'narrate':
        case 'speak':
        case 'input':  // Handle input just like narration
          // Construct character instructions
          const characterInstructions = pendingEvent.character 
            ? `You are ${pendingEvent.character.name}. ${pendingEvent.character.prompt}. 
               Your personality is ${JSON.stringify(pendingEvent.character.personality)}.
               ${pendingEvent.emotion ? `Speak with ${pendingEvent.emotion} emotion.` : ''}
               Say exactly: "${pendingEvent.text}"`
            : `You are the Narrator. Warm, friendly storyteller with a magical presence. 
               Your personality is engaging and imaginative, your goal is to guide children 
               through the story while building excitement, and your speech style is clear, 
               warm, and filled with wonder.
               Say exactly: "${pendingEvent.text}"`;

          console.log('Sending response with instructions:', {
            voice: pendingEvent.character?.voice || 'nova',
            instructions: characterInstructions.substring(0, 100) + '...'
          });

          // Send response configuration directly
          this.client.realtime.send('response.create', {
            response: {
              modalities: ['text', 'audio'],
              voice: pendingEvent.character?.voice || 'nova', // Default to Narrator voice
              instructions: characterInstructions,
              temperature: 0.7,
              output_audio_format: 'pcm16'
            }
          });
          break;
      }

      return audioEvent;
    } catch (error) {
      console.error('Error processing audio event:', error);
      this.isProcessing = false;
      this.currentEventId = undefined;
      return null;
    }
  }

  public async replayEvent(eventId: string): Promise<void> {
    const audioEvent = this.audioEvents.get(eventId);
    if (!audioEvent || audioEvent.status !== 'complete' || !audioEvent.file) {
      console.log('Cannot replay event:', { 
        hasEvent: !!audioEvent, 
        status: audioEvent?.status, 
        hasFile: !!audioEvent?.file 
      });
      return;
    }

    console.log('Replaying event:', eventId);
    audioEvent.status = 'playing';
    this.audioEvents.set(eventId, audioEvent);

    try {
      // Create an audio element to play the WAV file
      const audio = new Audio(URL.createObjectURL(audioEvent.file));
      await audio.play();
      
      // Wait for playback to complete
      await new Promise(resolve => audio.onended = resolve);
    } catch (error) {
      console.error('Error replaying audio:', error);
    } finally {
      audioEvent.status = 'complete';
      this.audioEvents.set(eventId, audioEvent);
    }
  }

  public getEventStatus(eventId: string): 'pending' | 'playing' | 'complete' | null {
    return this.audioEvents.get(eventId)?.status || null;
  }

  public getAllEvents(): AudioEvent[] {
    return Array.from(this.audioEvents.values());
  }
}
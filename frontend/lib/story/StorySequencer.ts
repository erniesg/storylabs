import type { ParsedScene, StoryEvent } from './SceneParser';
import { audioService } from '../audio/AudioService';
import { API_URL } from '../../src/services/api';


interface AudioEvent {
  id: string;
  text: string;
  status: 'pending' | 'playing' | 'complete';
}

interface SequencerOptions {
  apiKey?: string;
  serverUrl?: string;
}

export class StorySequencer {
  private currentScene?: ParsedScene;
  private audioEvents: Map<string, AudioEvent> = new Map();
  private isProcessing: boolean = false;
  private currentEventId?: string;
  private readonly options: SequencerOptions;

  constructor(options: SequencerOptions) {
    this.options = options;
  }

  public async loadScene(scene: ParsedScene): Promise<void> {
    console.log('Loading scene:', scene);
    this.currentScene = scene;
    this.audioEvents.clear();
    this.currentEventId = undefined;
    this.isProcessing = false;
    
    for (const event of scene.events) {
      this.audioEvents.set(event.id, {
        id: event.id,
        text: event.content,
        status: 'pending'
      });
    }
    console.log('Scene loaded, events initialized:', this.audioEvents.size);
    
    //await this.processNextEvent();
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
    audioEvent.status = 'playing';
    //
    /* try {
      const response = await fetch(`${API_URL}/api/story/generate-audio`, {          
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: pendingEvent.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();

      audioEvent.status = 'complete';
      this.isProcessing = false;
      this.currentEventId = undefined;
      this.processNextEvent();
      return audioEvent;
    } catch (error) {
      console.error('Error processing audio event:', error);
      this.isProcessing = false;
      this.currentEventId = undefined;
      audioEvent.status = 'pending';
      return null;
    } */
  }

  public getEventStatus(eventId: string): 'pending' | 'playing' | 'complete' | null {
    return this.audioEvents.get(eventId)?.status || null;
  }

  public getAllEvents(): AudioEvent[] {
    return Array.from(this.audioEvents.values());
  }
}
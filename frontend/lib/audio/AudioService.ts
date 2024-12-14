// frontend/lib/audio/AudioService.ts
import { WavStreamPlayer } from '../wavtools/lib/wav_stream_player';

type AudioEventType = 'stateChange' | 'error' | 'progress';
type AudioState = 'idle' | 'playing' | 'error';  // Only states we can actually have
type AudioEventCallback = (data: any) => void;
type FrequencyChannel = 'voice' | 'frequency' | 'music';

class AudioService {
  private static instance: AudioService;
  private player: WavStreamPlayer;
  private isInitialized: boolean = false;
  private currentState: AudioState = 'idle';
  private eventListeners: Map<AudioEventType, Set<AudioEventCallback>> = new Map();
  private currentTrackId?: string;

  private constructor() {
    this.player = new WavStreamPlayer({ sampleRate: 24000 });
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.player.connect();
      this.isInitialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      throw error;
    }
  }

  // Event handling
  on(eventType: AudioEventType, callback: AudioEventCallback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  off(eventType: AudioEventType, callback: AudioEventCallback) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private setState(newState: AudioState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.emit('stateChange', newState);
    }
  }

  private emit(eventType: AudioEventType, data: any) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Core streaming method
  streamAudioChunk(audioData: Int16Array, trackId: string) {
    if (!this.isInitialized) {
      throw new Error('AudioService not initialized');
    }

    try {
      this.currentTrackId = trackId;
      this.player.add16BitPCM(audioData, trackId);
      this.setState('playing');
      
      this.emit('progress', {
        trackId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error streaming audio chunk:', error);
      this.setState('error');
      this.emit('error', error);
    }
  }

  // Stop current stream
  async stop() {
    if (!this.isInitialized) {
      throw new Error('AudioService not initialized');
    }

    try {
      await this.player.interrupt();
      this.setState('idle');
      this.currentTrackId = undefined;
    } catch (error) {
      console.error('Error stopping audio:', error);
      this.setState('error');
      throw error;
    }
  }

  // State getters
  getState(): AudioState {
    return this.currentState;
  }

  isPlaying(): boolean {
    return this.currentState === 'playing';
  }

  getCurrentTrackId(): string | undefined {
    return this.currentTrackId;
  }

  getFrequencies(channel: FrequencyChannel = 'voice'): { values: Float32Array } | null {
    if (!this.isInitialized) return null;
    return this.player.getFrequencies(channel);
  }

  // Cleanup
  async destroy() {
    if (this.isInitialized) {
      await this.stop();
      this.eventListeners.clear();
      this.isInitialized = false;
    }
  }
}

export const audioService = AudioService.getInstance();
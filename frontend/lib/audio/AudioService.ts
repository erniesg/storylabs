// AudioService.ts
import { WavStreamPlayer } from '../wavtools/lib/wav_stream_player';

class AudioService {
  private static instance: AudioService;
  private player: WavStreamPlayer;
  private isInitialized: boolean = false;
  private audioContext: AudioContext | null = null;

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
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      await this.player.connect();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioService:', error);
      throw error;
    }
  }

  async streamAudioChunk(audioData: Int16Array, trackId: string) {
    if (!this.isInitialized) {
      throw new Error('AudioService not initialized');
    }
    this.player.add16BitPCM(audioData, trackId);
  }

  async interrupt() {
    if (!this.isInitialized) return;
    return this.player.interrupt();
  }

  getFrequencies(channel: 'voice' | 'frequency' | 'music' = 'voice') {
    if (!this.isInitialized) return null;
    return this.player.getFrequencies(channel);
  }

  async unlockAudio() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

export const audioService = AudioService.getInstance();
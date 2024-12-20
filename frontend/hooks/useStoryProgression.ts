import { useState, useCallback, useRef } from 'react';
import { playAudio } from '@/src/services/api';

interface StoryEvent {
  type: 'narrate' | 'speak' | 'input';
  character: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  content?: string;
  emotion: string;
  id: string;
  order: number;
}

interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  events: StoryEvent[];
}

export function useStoryProgression(
  story: { scenes: Scene[] }, 
  audioProvider: 'openai' | 'elevenlabs' = 'elevenlabs'
) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasInitializedRef = useRef(false);
  const playingRequestRef = useRef<Promise<void> | null>(null);

  const currentScene = story.scenes[currentSceneIndex];
  const currentEvent = currentScene?.events[currentEventIndex];

  const playCurrentEvent = useCallback(async (eventToPlay = currentEvent) => {
    if (!eventToPlay || isPlaying || eventToPlay.type === 'input' || playingRequestRef.current) return;

    console.log('🎭 Playing Event:', {
      sceneIndex: currentSceneIndex,
      eventIndex: currentEventIndex,
      sceneId: currentScene?.id,
      eventType: eventToPlay.type,
      isInitialized: hasInitializedRef.current,
      character: eventToPlay.character || 'Narrator',
      text: eventToPlay.content,
      voice: eventToPlay.voice
    });

    setIsPlaying(true);
    try {
      playingRequestRef.current = playAudio(eventToPlay.content || '', eventToPlay.voice, audioProvider);
      const startTime = Date.now();
      
      await playingRequestRef.current;
      
      const duration = Date.now() - startTime;
      console.log('🎵 Audio Complete:', {
        duration: `${duration}ms`,
        sceneIndex: currentSceneIndex,
        eventIndex: currentEventIndex,
        text: eventToPlay.content
      });

      hasInitializedRef.current = true;
    } catch (error) {
      console.error('❌ Error playing event:', error);
    } finally {
      setIsPlaying(false);
      playingRequestRef.current = null;
    }
  }, [currentEvent, isPlaying, audioProvider, currentScene?.id, currentSceneIndex, currentEventIndex]);

  const initializeFirstEvent = useCallback(async () => {
    if (!hasInitializedRef.current && currentEvent && !playingRequestRef.current) {
      await playCurrentEvent();
    }
  }, [currentEvent, playCurrentEvent]);

  const handleNext = useCallback(async () => {
    if (isPlaying || playingRequestRef.current) return;

    if (currentEventIndex < currentScene.events.length - 1) {
      const nextEventIndex = currentEventIndex + 1;
      const nextEvent = currentScene.events[nextEventIndex];

      console.log('⏭️ Moving to next event', {
        fromIndex: currentEventIndex,
        toIndex: nextEventIndex,
        totalEvents: currentScene.events.length,
        nextEventContent: nextEvent.content
      });
      
      setCurrentEventIndex(nextEventIndex);
      
      playCurrentEvent(nextEvent);
      
    } else if (currentSceneIndex < story.scenes.length - 1) {
      const nextSceneIndex = currentSceneIndex + 1;
      const nextScene = story.scenes[nextSceneIndex];
      const firstEvent = nextScene.events[0];

      console.log('📺 Moving to next scene', {
        fromScene: currentSceneIndex,
        toScene: nextSceneIndex,
        firstEventContent: firstEvent.content
      });
      
      setCurrentSceneIndex(nextSceneIndex);
      setCurrentEventIndex(0);
      
      playCurrentEvent(firstEvent);
    }
  }, [
    currentEventIndex, 
    currentScene?.events, 
    currentSceneIndex, 
    story.scenes, 
    isPlaying, 
    playCurrentEvent,
    playingRequestRef.current
  ]);

  const canProgress = !isPlaying && hasInitializedRef.current && (
    currentEventIndex < currentScene?.events.length - 1 || 
    currentSceneIndex < story.scenes.length - 1
  );

  return {
    currentScene,
    currentEvent,
    isPlaying,
    isInitialized: hasInitializedRef.current,
    playCurrentEvent,
    initializeFirstEvent,
    handleNext,
    canProgress,
    progress: {
      scene: currentSceneIndex + 1,
      totalScenes: story.scenes.length,
      event: currentEventIndex + 1,
      totalEvents: currentScene?.events.length || 0
    }
  };
}

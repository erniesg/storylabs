'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SceneParser } from '@/lib/story/SceneParser'
import { StorySequencer } from '@/lib/story/StorySequencer'
import { WavRenderer } from '@/lib/wavtools/WavRenderer'
import type { ParsedScene, StoryEvent } from '@/lib/story/SceneParser'
import { audioService } from '@/lib/audio/AudioService'
import { useStoryGeneration } from '@/hooks/useStoryGeneration'
import { LoadingSpinner } from '@/app/components/LoadingSpinner'
import ImageComponent from './ImageComponent' // Import the ImageComponent

interface StoryInterfaceProps {
  userInfo: {
    name: string
    age: string
    interests: string
  }
}

export default function StoryInterface({ userInfo }: StoryInterfaceProps) {
  const { story, isLoading: isGenerating, error: generationError } = useStoryGeneration({ userInfo });

  const [sequencer, setSequencer] = useState<StorySequencer | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [scene, setScene] = useState<ParsedScene | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const currentEvent = scene?.events[currentEventIndex];
  const isAudioPlaying = sequencer?.getEventStatus(currentEvent?.id || '') === 'playing';
  const currentSceneId = story?.story.main.flow[currentSceneIndex];

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  useEffect(() => {
    if (!story || !apiKey || !currentSceneId) return;

    let mounted = true;

    async function loadScene() {
      try {
        let seq = sequencer;
        if (!seq) {
          seq = new StorySequencer({ apiKey });
          await seq.connect();
          if (!mounted) return;
          setSequencer(seq);
        }

        const sceneContent = story.story.scenes.find(s => s.id === currentSceneId);
        if (!sceneContent) return;

        const parser = new SceneParser(JSON.stringify(story.story.characters));
        const parsedScene = parser.parseScene(sceneContent); // Pass the sceneContent directly
        await seq.loadScene(parsedScene);

        if (!mounted) return;
        setScene(parsedScene);
        setCurrentEventIndex(0);

        await audioService.unlockAudio();
        await seq.processNextEvent();
      } catch (error) {
        console.error('Error loading scene:', error);
      }
    }

    loadScene();
    return () => {
      mounted = false;
    };
  }, [story, apiKey, currentSceneId]);

  useEffect(() => {
    // ... Audio visualization code ...
  }, [scene]);

  const goToNextScene = async () => {
    if (currentSceneIndex < story!.story.main.flow.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    }
  };

  const goToPreviousScene = async () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  };

  const playCurrentEvent = async () => {
    if (!sequencer || isAudioPlaying || !currentEvent) return;
    await audioService.unlockAudio();
    await sequencer.processNextEvent();
  };

  const goToNextEvent = () => {
    if (scene && currentEventIndex < scene.events.length - 1 && !isAudioPlaying) {
      setCurrentEventIndex(prev => prev + 1);
    }
  };

  const goToPreviousEvent = () => {
    if (currentEventIndex > 0 && !isAudioPlaying) {
      setCurrentEventIndex(prev => prev - 1);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
        <p className="ml-2">Generating your story...</p>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {generationError}
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-purple-800">
          {story.story.main.title}
        </h2>
        <div className="text-sm text-gray-600">
          Scene {currentSceneIndex + 1} of {story.story.main.flow.length}
        </div>
      </div>
      <div className="relative h-80 mb-6">
        <AnimatePresence mode="wait">
          <ImageComponent prompt={scene?.prompt || ''} />
        </AnimatePresence>
      </div>
      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <canvas ref={canvasRef} className="w-full h-24" />
      </div>
      <motion.p
        key={`text-${currentEventIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl text-gray-800 mb-6 text-center"
      >
        {currentEvent?.text}
      </motion.p>
      <div className="text-lg text-gray-700 mb-6">
        {currentEvent?.content} {/* Display the event content */}
      </div>
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            onClick={goToPreviousScene}
            disabled={currentSceneIndex === 0 || isAudioPlaying}
            variant="outline"
          >
            Previous Scene
          </Button>
          <Button
            onClick={goToNextScene}
            disabled={currentSceneIndex >= story.story.main.flow.length - 1 || isAudioPlaying}
            variant="outline"
          >
            Next Scene
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={goToPreviousEvent}
            disabled={currentEventIndex === 0 || isAudioPlaying}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={playCurrentEvent}
            disabled={isAudioPlaying}
            variant="default"
          >
            {isAudioPlaying ? 'Playing...' : 'Play'}
          </Button>
          <Button
            onClick={goToNextEvent}
            disabled={currentEventIndex >= scene?.events.length - 1 || isAudioPlaying}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
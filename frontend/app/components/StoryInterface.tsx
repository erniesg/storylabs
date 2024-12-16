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
import { playAudio } from '@/src/services/api'

interface StoryInterfaceProps {
  userInfo: {
    name: string;
    age: string;
    interests: string;
  };
  story: any; // Replace 'any' with the actual type of your story object
  generationError: string | null;
}

export default function StoryInterface({ userInfo, story, generationError }: StoryInterfaceProps) {
  console.log('StoryInterface props:', { userInfo, story, generationError });
  const [sequencer, setSequencer] = useState<StorySequencer | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [scene, setScene] = useState<ParsedScene | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  //const currentEvent = scene?.events[currentEventIndex];
  //const isAudioPlaying = sequencer?.getEventStatus(currentEvent?.id || '') === 'playing';
  const currentSceneId = story?.main.flow[currentSceneIndex];
  const audioPlayedRef = useRef(false);


  /* useEffect(() => {
    if (!story || !currentSceneId) return;

    let mounted = true;

    async function loadScene() {
      try {
        let seq = sequencer;
        if (!seq) {
          seq = new StorySequencer({});
          if (!mounted) return;
          setSequencer(seq);
        }

        const sceneContent = story?.scenes.find(s => s.id === currentSceneId);
        console.log(`sceneContent:`, sceneContent);
        if (!sceneContent) return;

        const parser = new SceneParser(JSON.stringify(story.scenes));
        console.log(`parser:`, parser);
        const parsedScene = parser.parseScene(sceneContent);
        console.log(`parsedScene:`, parsedScene);
        await seq.loadScene(parsedScene);

        if (!mounted) return;
        setScene(parsedScene);
        setCurrentEventIndex(0);

        //await audioService.unlockAudio();
        //await seq.processNextEvent();
      } catch (error) {
        console.error('Error loading scene:', error);
      }
    }

    loadScene();
    return () => {
      mounted = false;
    };
  }, [story, currentSceneId]); */


  useEffect(() => {
    if (story && story.scenes[currentSceneIndex]) {
      const currentScene = story.scenes[currentSceneIndex];
      const currentEvent = currentScene.events[currentEventIndex];
  
      if (!audioPlayedRef.current) {
        playAudio(currentEvent.content);
        audioPlayedRef.current = true; // Mark audio as played
      }
    }
  }, [currentSceneIndex, currentEventIndex, story]);

  const goToNextScene = async () => {
    if (currentSceneIndex < story!.main.flow.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    }
    if (audioPlayedRef.current) {
      audioPlayedRef.current = false;
    }
  };

  //const goToPreviousScene = async () => {
  //  if (currentSceneIndex > 0) {
  //    setCurrentSceneIndex(prev => prev - 1);
  //  }
  //};

  //const playCurrentEvent = async () => {
  //  if (!sequencer || isAudioPlaying || !currentEvent) return;
  //  await audioService.unlockAudio();
  //  await sequencer.processNextEvent();
  //};

  //const goToNextEvent = () => {
  //  if (scene && currentEventIndex < scene.events.length - 1 && !isAudioPlaying) {
  //    setCurrentEventIndex(prev => prev + 1);
  //  }
  //};

  //const goToPreviousEvent = () => {
  //  if (currentEventIndex > 0 && !isAudioPlaying) {
  //    setCurrentEventIndex(prev => prev - 1);
  //  }
  //};

  if (generationError) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {generationError}
      </div>
    );
  }

  if (!story) return null;
  //console.log(`story`, story.scenes[currentSceneIndex].events[currentEventIndex].content)
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-purple-800">
          {story.main.title}
        </h2>
        <div className="text-sm text-gray-600">
          Scene {currentSceneIndex + 1} of {story.main.flow.length}
        </div>
      </div>
      <div className="relative h-80 mb-6">
        <AnimatePresence mode="wait">
          <motion.img
              src={story?.scenes[currentSceneIndex].imageUrl || ''}
              alt={story?.scenes[currentSceneIndex].name || 'Scene Image'}
              className="w-full h-full object-cover"
            />
        </AnimatePresence>
      </div>
      <div className="text-lg text-gray-700 mb-6">
        {story.scenes[currentSceneIndex].events[currentEventIndex].content} 
      </div>
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            onClick={goToNextScene}
            //disabled={currentSceneIndex >= story.main.flow.length - 1 || isAudioPlaying}
            variant="outline"
          >
            Next Scene
          </Button>
        </div>
      </div>
    </div>
  );
}

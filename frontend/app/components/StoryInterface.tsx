'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useStoryProgression } from '@/hooks/useStoryProgression'
import { ChevronRight, MessageCircle } from 'lucide-react'
import { LoadingSpinner } from '@/app/components/LoadingSpinner'
import ReviewPage from './ReviewPage'

interface StoryEvent {
  type: 'speak' | 'narrate' | 'input';
  character?: string;
  content?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  emotion?: string;
  id?: string;
  order?: number;
}

interface StoryInterfaceProps {
  userInfo: {
    name: string;
    age: string;
    interests: string;
  };
  story: any; // Replace with proper type
  generationError: string | null;
  onStartNewStory: () => void;
}

const SpeakingAvatar = () => (
  <div className="relative inline-flex items-center justify-center w-8 h-8 mr-3">
    <motion.div
      className="absolute w-full h-full bg-purple-200 rounded-full animate-speaking"
    />
    <MessageCircle className="w-5 h-5 text-purple-600 z-10" />
  </div>
);

export default function StoryInterface({ userInfo, story, generationError, onStartNewStory }: StoryInterfaceProps) {
  const {
    currentScene,
    currentEvent,
    isPlaying,
    initializeFirstEvent,
    handleNext,
    canProgress,
    progress
  } = useStoryProgression(story, 'openai');

  // Add state for showing review
  const [showReview, setShowReview] = useState(false);

  // Modify handleNext to show review when story ends
  const handleNextWithReview = async () => {
    if (!canProgress) {
      // If we can't progress anymore, show the review page
      setShowReview(true);
    } else {
      await handleNext();
    }
  };

  // Only initialize first event once
  useEffect(() => {
    initializeFirstEvent();
  }, [initializeFirstEvent]);

  const formatContent = (event: StoryEvent) => {
    if (event.type === 'speak') {
      return (
        <div className="flex items-start">
          <SpeakingAvatar />
          <div>
            <span className="character-name">{event.character}:</span>
            <span className="character-speech ml-2">"{event.content}"</span>
          </div>
        </div>
      );
    }
    // For narration, return plain text
    return <div className="narrator-text">{event.content}</div>;
  };

  if (showReview) {
    return <ReviewPage story={story} onStartNewStory={onStartNewStory} />;
  }

  if (generationError) {
    return <div className="text-red-500 text-center p-4">Error: {generationError}</div>;
  }

  if (!story) return null;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-purple-800">
          {story.main.title}
        </h2>
        <div className="text-sm text-gray-600">
          Scene {progress.scene} of {progress.totalScenes}
        </div>
      </div>

      <div className="relative h-80 mb-6">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentScene?.imageUrl}
            src={currentScene?.imageUrl}
            alt={currentScene?.name}
            className="w-full h-full object-cover rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        </AnimatePresence>
      </div>

      <div className="text-lg mb-6">
        {currentEvent && formatContent(currentEvent)}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Event {progress.event} of {progress.totalEvents}
        </div>
        
        <div className="flex gap-4 items-center">
          {isPlaying && (
            <div className="flex items-center gap-2 text-purple-600">
              <LoadingSpinner />
              Playing audio...
            </div>
          )}
          
          <Button
            onClick={handleNextWithReview}
            disabled={!canProgress || isPlaying}
            className="text-lg py-2 px-6 bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold rounded-full 
                     transition-all duration-200 transform hover:scale-105 
                     disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed 
                     flex items-center gap-2"
          >
            {progress.event < progress.totalEvents ? 'Next Event' : 'Next Scene'}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

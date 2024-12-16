import { useState, useEffect } from 'react';
import type { Story } from '../lib/story/types';
import { API_URL } from '../src/services/api';

interface UseStoryGenerationProps {
  userInfo: {
    name: string;
    age: string;
    interests: string;
  };
}

export function useStoryGeneration({ userInfo }: UseStoryGenerationProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect triggered with userInfo:', userInfo);
    async function generateStory() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/api/story/generate`, {          
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            child_name: userInfo.name,
            child_age: userInfo.age,
            child_interests: userInfo.interests
          })
        });

        if (!response.ok) throw new Error('Failed to generate story');
        
        const storyData = await response.json();
        setStory(storyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate story');
      } finally {
        setIsLoading(false);
      }
    }
    console.log('Generating story...');
    generateStory();
  }, [userInfo]);

  return { story, isLoading, error };
}
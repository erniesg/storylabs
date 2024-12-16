'use client'

import { useState } from 'react'
import LandingPage from './components/LandingPage'
import UserInputForm from './components/UserInputForm'
import StoryInterface from './components/StoryInterface'
import { generateStory } from '../src/services/api';
import ProgressBar from './components/ProgressBar';
import { LoadingSpinner } from './components/LoadingSpinner';



export default function Home() {
  const [stage, setStage] = useState('landing')
  const [userInfo, setUserInfo] = useState({ name: '', age: '', interests: '' })
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleStart = () => setStage('userInput')
  const handleUserInfoSubmit = async (info: typeof userInfo) => {
    console.log('Setting user info that was submitted:', info);
    setUserInfo(info)
    setIsGenerating(true); // Start progress bar
    //generate story using the generateStory function
    try {
      const { story } = await generateStory(info);
      //const story = { main, characters, scenes };
      console.log('Story generated:', {story});
      // Update your state or perform other actions with the story
      setStory(story);
      console.log('Story set:', {story});
      setStage('story');
    } catch (error) {
      console.error('Error generating story:', error);
      // Handle the error, e.g., set an error state
    } finally {
      setIsGenerating(false); // Stop progress bar
    }
    //setStage('story')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-400 to-purple-500">
      {stage === 'landing' && <LandingPage onStart={handleStart} />}
      {stage === 'userInput' && <UserInputForm onSubmit={handleUserInfoSubmit} />}
      {stage === 'story' && <StoryInterface userInfo={userInfo} story={story} generationError={generationError} />}
      {isGenerating && (
        <>
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner />
            <p className="ml-2 text-white">Generating your story. This should take less than a minute ...</p>
          </div>
        </>
      )}
    </main>
  )
}


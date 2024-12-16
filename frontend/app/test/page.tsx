// frontend/app/test/page.tsx
'use client'
import { useState } from 'react'
import StoryInterface from '@/app/components/StoryInterface'

export default function TestPage() {
  const [isStarted, setIsStarted] = useState(false)

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button 
          onClick={() => setIsStarted(true)}
          className="text-lg py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-full transition-all duration-200"
        >
          Start Story
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <StoryInterface 
        userInfo={{
          name: "Test Child",
          age: "7",
          interests: "space,science"
        }}
      />
    </div>
  );
}
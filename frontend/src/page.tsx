'use client'

import { useState } from 'react'
import LandingPage from './components/LandingPage'
import UserInputForm from './components/UserInputForm'
import StoryInterface from './components/StoryInterface'

export default function Home() {
  const [stage, setStage] = useState('landing')
  const [userInfo, setUserInfo] = useState({ name: '', age: '', interests: '' })

  const handleStart = () => setStage('userInput')
  const handleUserInfoSubmit = (info: typeof userInfo) => {
    setUserInfo(info)
    setStage('story')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-400 to-purple-500">
      {stage === 'landing' && <LandingPage onStart={handleStart} />}
      {stage === 'userInput' && <UserInputForm onSubmit={handleUserInfoSubmit} />}
      {stage === 'story' && <StoryInterface userInfo={userInfo} />}
    </main>
  )
}

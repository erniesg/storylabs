'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface LandingPageProps {
  onStart: () => void
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="text-center w-full h-screen flex flex-col items-center justify-center">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-6xl font-bold text-white mb-8"
      >
        StoryLabs
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-2xl text-white mb-12"
      >
        An interactive reading adventure for preschoolers!
      </motion.p>
      <AudioWaveform />
      <Button
        onClick={onStart}
        size="lg"
        className="mt-8 text-2xl py-6 px-8 rounded-full bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold transition-all duration-200 transform hover:scale-105"
      >
        Click to Start
      </Button>
    </div>
  )
}

function AudioWaveform() {
  return (
    <svg width="200" height="50" viewBox="0 0 200 50" className="mx-auto mb-8">
      <motion.path
        d="M0 25 Q25 5 50 25 T100 25 T150 25 T200 25"
        fill="none"
        stroke="white"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  )
}


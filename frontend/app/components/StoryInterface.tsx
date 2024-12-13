'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface StoryInterfaceProps {
  userInfo: {
    name: string
    age: string
    interests: string
  }
}

// Mock story data (in a real app, this would be generated based on user input)
const storyPages = [
  {
    backdrop: '/placeholder.svg?height=300&width=500',
    character: '/placeholder.svg?height=200&width=100',
    dialogue: 'Once upon a time, in a magical land...',
  },
  {
    backdrop: '/placeholder.svg?height=300&width=500',
    character: '/placeholder.svg?height=200&width=100',
    dialogue: 'There was a brave hero named...',
  },
  {
    backdrop: '/placeholder.svg?height=300&width=500',
    character: '/placeholder.svg?height=200&width=100',
    dialogue: 'Who loved to go on exciting adventures!',
  },
]

export default function StoryInterface({ userInfo }: StoryInterfaceProps) {
  const [currentPage, setCurrentPage] = useState(0)

  const goToNextPage = () => {
    if (currentPage < storyPages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
      <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">
        {userInfo.name}'s Adventure
      </h2>
      <div className="relative h-80 mb-6">
        <AnimatePresence mode="wait">
          <motion.img
            key={`backdrop-${currentPage}`}
            src={storyPages[currentPage].backdrop}
            alt="Story backdrop"
            className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
          <motion.img
            key={`character-${currentPage}`}
            src={storyPages[currentPage].character}
            alt="Story character"
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-3/4 object-contain"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </AnimatePresence>
      </div>
      <motion.p
        key={`dialogue-${currentPage}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl text-gray-800 mb-6 text-center"
      >
        {storyPages[currentPage].dialogue}
      </motion.p>
      <div className="flex justify-between">
        <Button
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
          className="text-lg py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-full transition-all duration-200 transform hover:scale-105"
        >
          Previous
        </Button>
        <Button
          onClick={goToNextPage}
          disabled={currentPage === storyPages.length - 1}
          className="text-lg py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold rounded-full transition-all duration-200 transform hover:scale-105"
        >
          Next
        </Button>
      </div>
    </div>
  )
}


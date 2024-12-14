'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SceneParser } from '@/lib/story/SceneParser'
import { StorySequencer } from '@/lib/story/StorySequencer'
import { AudioAnalysis } from '@/lib/wavtools'

interface StoryInterfaceProps {
  userInfo: {
    name: string
    age: string
    interests: string
  }
}

export default function StoryInterface({ userInfo }: StoryInterfaceProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [sequencer, setSequencer] = useState<StorySequencer | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioData, setAudioData] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Initialize with env variable
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

  useEffect(() => {
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY')
      return
    }

    async function initializeStory() {
      try {
        // Initialize sequencer
        const seq = new StorySequencer({ apiKey })
        await seq.connect()
        setSequencer(seq)

        // Load characters and scene
        const charactersResponse = await fetch('/stories/characters.md')
        const sceneResponse = await fetch('/stories/scene_rocket_intro.md')
        
        const charactersText = await charactersResponse.text()
        const sceneText = await sceneResponse.text()

        // Parse scene
        const parser = new SceneParser(charactersText)
        const scene = parser.parseScene(sceneText)
        
        // Load scene into sequencer
        await seq.loadScene(scene)
        setEvents(scene.events)
      } catch (error) {
        console.error('Error initializing story:', error)
      }
    }

    initializeStory()

    // Cleanup
    return () => {
      sequencer?.disconnect()
    }
  }, [apiKey])

  // Audio visualization
  useEffect(() => {
    if (!sequencer || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrame: number

    const drawWaveform = () => {
      if (!sequencer || !ctx) return
      
      const frequencies = sequencer.player.getFrequencies('voice')
      const { values } = frequencies
      setAudioData(Array.from(values))

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw waveform
      ctx.beginPath()
      ctx.strokeStyle = '#9333ea' // Purple
      ctx.lineWidth = 2
      
      const barWidth = canvas.width / values.length
      values.forEach((value, i) => {
        const x = i * barWidth
        const height = value * canvas.height
        const y = (canvas.height - height) / 2
        
        ctx.moveTo(x, canvas.height / 2)
        ctx.lineTo(x, y)
      })
      
      ctx.stroke()
      
      animationFrame = requestAnimationFrame(drawWaveform)
    }

    if (isPlaying) {
      drawWaveform()
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isPlaying, sequencer])

  const playCurrentEvent = async () => {
    if (!sequencer || isPlaying) return

    setIsPlaying(true)
    try {
      const event = await sequencer.processNextEvent()
      if (event) {
        await sequencer.playEvent(event.id)
      }
    } catch (error) {
      console.error('Error playing event:', error)
    }
    setIsPlaying(false)
  }

  const goToNextEvent = async () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1)
      await playCurrentEvent()
    }
  }

  const goToPreviousEvent = async () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(currentEventIndex - 1)
      const eventId = events[currentEventIndex - 1].id
      await sequencer?.replayEvent(eventId)
    }
  }

  const currentEvent = events[currentEventIndex]

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
      <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">
        {userInfo.name}'s Adventure
      </h2>
      
      <div className="relative h-80 mb-6">
        <AnimatePresence mode="wait">
          <motion.img
            key={`backdrop-${currentEventIndex}`}
            src={`/assets/scenes/${currentEvent?.scene || 'default'}.jpg`}
            alt="Story backdrop"
            className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
          {currentEvent?.character && (
            <motion.div
              key={`character-${currentEventIndex}`}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative">
                <img 
                  src={`/assets/characters/${currentEvent.character.name.toLowerCase()}.png`}
                  alt={currentEvent.character.name}
                  className="h-64 object-contain"
                />
                {currentEvent.emotion && (
                  <div className="absolute top-0 right-0 bg-yellow-400 px-2 py-1 rounded-full text-sm">
                    {currentEvent.emotion}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audio Waveform */}
      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <canvas 
          ref={canvasRef}
          width={800}
          height={100}
          className="w-full"
        />
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

      <div className="flex justify-between">
        <Button
          onClick={goToPreviousEvent}
          disabled={currentEventIndex === 0 || isPlaying}
          className="text-lg py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-full transition-all duration-200"
        >
          Previous
        </Button>
        <Button
          onClick={goToNextEvent}
          disabled={currentEventIndex === events.length - 1 || isPlaying}
          className="text-lg py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold rounded-full transition-all duration-200"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
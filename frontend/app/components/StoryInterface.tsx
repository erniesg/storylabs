// frontend/app/components/StoryInterface.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SceneParser } from '@/lib/story/SceneParser'
import { StorySequencer } from '@/lib/story/StorySequencer'
import { WavRenderer } from '@/lib/wavtools/WavRenderer'
import type { ParsedScene, StoryEvent } from '@/lib/story/SceneParser'
import { audioService } from '@/lib/audio/AudioService'
import type { AudioState } from '@/lib/audio/AudioService'

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
  const [events, setEvents] = useState<StoryEvent[]>([])
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [currentScene, setCurrentScene] = useState<ParsedScene | null>(null)
  const [eventStatus, setEventStatus] = useState<'pending' | 'playing' | 'complete'>('pending')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const isLoadedRef = useRef<boolean>(false)

  // Initialize with env variable
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

  // Initialize story and audio
  useEffect(() => {
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY')
      return
    }

    let mounted = true

    async function initializeStory() {
      try {
        // Create and connect sequencer
        const seq = new StorySequencer({ apiKey })
        await seq.connect()
        
        if (!mounted) return
        setSequencer(seq)

        // Load story assets
        const [charactersText, sceneText] = await Promise.all([
          fetch('/stories/characters.md').then(r => r.text()),
          fetch('/stories/scene_rocket_intro.md').then(r => r.text())
        ])

        // Parse and load scene
        const parser = new SceneParser(charactersText)
        const scene = parser.parseScene(sceneText)
        await seq.loadScene(scene)
        
        if (!mounted) return
        setEvents(scene.events)
        setCurrentScene(scene)
        isLoadedRef.current = true

        // Start first event
        const firstEvent = await seq.processNextEvent()
        if (firstEvent && mounted) {
          setEventStatus('playing')
          setIsAudioPlaying(true)
        }
      } catch (error) {
        console.error('Error initializing story:', error)
      }
    }

    initializeStory()

    return () => {
      mounted = false
      isLoadedRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (sequencer) {
        sequencer.disconnect()
      }
    }
  }, [apiKey])

  // Audio visualization
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const render = () => {
      if (!isLoadedRef.current || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const frequencies = audioService.getFrequencies('voice')
      if (frequencies) {
        WavRenderer.drawBars(
          canvas,
          ctx,
          frequencies.values,
          '#9333ea',
          10,
          0,
          8
        )
      }

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Event completion monitoring
  useEffect(() => {
    if (!sequencer || !events[currentEventIndex]) return;
    
    const checkInterval = setInterval(() => {
      if (!events[currentEventIndex]) return;
      
      const status = sequencer.getEventStatus(events[currentEventIndex].id);
      if (status === 'complete') {
        setEventStatus('complete');
        setIsAudioPlaying(false);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [sequencer, events, currentEventIndex]);

  // Audio playback controls
  const playCurrentEvent = async () => {
    if (!sequencer || eventStatus === 'playing') return;

    await audioService.unlockAudio();
    setEventStatus('playing');
    setIsAudioPlaying(true);

    try {
      await sequencer.processNextEvent();
    } catch (error) {
      console.error('Error playing event:', error);
      setEventStatus('pending');
      setIsAudioPlaying(false);
    }
  };

  const goToNextEvent = async () => {
    if (currentEventIndex < events.length - 1 && eventStatus !== 'playing') {
      setCurrentEventIndex(prev => prev + 1)
      setEventStatus('pending')
    }
  }

  const goToPreviousEvent = async () => {
    if (currentEventIndex > 0 && eventStatus !== 'playing') {
      setCurrentEventIndex(prev => prev - 1)
      setEventStatus('pending')
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
            src={`/assets/scenes/${currentEvent ? currentScene?.scene || 'default' : 'default'}.jpg`}
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

      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <canvas 
          ref={canvasRef}
          className="w-full h-24"
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

      <div className="flex justify-between items-center">
        <Button
          onClick={goToPreviousEvent}
          disabled={currentEventIndex === 0 || isAudioPlaying}
          variant="outline"
        >
          Previous
        </Button>

        <Button
          onClick={playCurrentEvent}
          disabled={isAudioPlaying || eventStatus === 'complete'}
          variant="default"
        >
          {isAudioPlaying ? 'Playing...' : 'Play'}
        </Button>

        <Button
          onClick={goToNextEvent}
          disabled={currentEventIndex >= events.length - 1 || isAudioPlaying}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
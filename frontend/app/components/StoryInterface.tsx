'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SceneParser } from '@/lib/story/SceneParser'
import { StorySequencer } from '@/lib/story/StorySequencer'
import { WavRenderer } from '@/lib/wavtools/WavRenderer'
import type { ParsedScene, StoryEvent } from '@/lib/story/SceneParser'
import { WavStreamPlayer, WavRecorder } from '@/lib/wavtools'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const isLoadedRef = useRef<boolean>(false)
  const [currentScene, setCurrentScene] = useState<ParsedScene | null>(null)
  const [eventStatus, setEventStatus] = useState<'pending' | 'playing' | 'complete'>('pending')
  
  // Audio processing refs
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  )
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  )
  
  // Initialize with env variable
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

  useEffect(() => {
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY')
      return
    }

    async function initializeStory() {
      try {
        console.log('Initializing story...')
        const seq = new StorySequencer({ apiKey })
        await seq.connect()
        console.log('Sequencer connected')
        setSequencer(seq)

        // Connect audio components
        await wavStreamPlayerRef.current.connect()
        await wavRecorderRef.current.begin()

        // Load characters and scene
        const charactersResponse = await fetch('/stories/characters.md')
        const sceneResponse = await fetch('/stories/scene_rocket_intro.md')
        
        const charactersText = await charactersResponse.text()
        const sceneText = await sceneResponse.text()

        // Parse scene
        const parser = new SceneParser(charactersText)
        const scene = parser.parseScene(sceneText)
        
        // Load scene into sequencer and set state
        await seq.loadScene(scene)
        setEvents(scene.events)
        setCurrentScene(scene)
        isLoadedRef.current = true

        // Process first event automatically
        console.log('Processing first event...')
        const firstEvent = await seq.processNextEvent()
        if (firstEvent) {
          setEventStatus('playing')
          setIsAudioPlaying(true)
          console.log('First event started:', firstEvent)
        }
      } catch (error) {
        console.error('Error initializing story:', error)
      }
    }

    initializeStory()

    // Cleanup
    return () => {
      isLoadedRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // Check recorder status before ending
      if (wavRecorderRef.current?.getStatus() === 'recording') {
        wavRecorderRef.current?.end()
      }
      
      // Interrupt player if active
      wavStreamPlayerRef.current?.interrupt()
      
      // Disconnect sequencer last
      if (sequencer) {
        sequencer.disconnect()
      }
    }
  }, [apiKey])

  // Audio visualization
  useEffect(() => {
    if (!sequencer || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set initial canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const render = () => {
      if (!isLoadedRef.current || !ctx || !sequencer) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get frequencies from both recorder and player
      const recorderFreq = wavRecorderRef.current.getFrequencies('voice')
      const playerFreq = wavStreamPlayerRef.current.getFrequencies('voice')
      
      // Use player frequencies when playing, recorder when recording
      const frequencies = isAudioPlaying ? playerFreq : recorderFreq

      if (frequencies) {
        WavRenderer.drawBars(
          canvas,
          ctx,
          frequencies.values,
          '#9333ea', // Purple color
          10,        // Bar width
          0,         // Min height
          8          // Scale
        )
      }

      animationRef.current = requestAnimationFrame(render)
    }

    // Start render loop
    render()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [sequencer])

  const playCurrentEvent = async () => {
    if (!sequencer || eventStatus === 'playing') return

    console.log('Playing event:', currentEventIndex)
    setEventStatus('playing')
    setIsAudioPlaying(true)

    try {
      const event = await sequencer.processNextEvent()
      if (event) {
        console.log('Event processed:', event)
        // Wait for the event to complete
        const checkStatus = setInterval(() => {
          const status = sequencer.getEventStatus(event.id)
          console.log('Event status:', status)
          if (status === 'complete') {
            clearInterval(checkStatus)
            setEventStatus('complete')
            setCurrentEventIndex(prev => prev + 1)
            setIsAudioPlaying(false)
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error playing event:', error)
      setEventStatus('pending')
      setIsAudioPlaying(false)
    }
  }

  const replayCurrentEvent = async () => {
    if (!sequencer || !currentEvent) return
    
    setIsAudioPlaying(true)
    setEventStatus('playing')
    await sequencer.replayEvent(currentEvent.id)
    setEventStatus('complete')
    setIsAudioPlaying(false)
  }

  const goToNextEvent = async () => {
    if (currentEventIndex < events.length - 1 && eventStatus !== 'playing') {
      setEventStatus('pending')
      await playCurrentEvent()
    }
  }

  const goToPreviousEvent = async () => {
    if (currentEventIndex > 0 && eventStatus !== 'playing') {
      setCurrentEventIndex(prev => prev - 1)
      const eventId = events[currentEventIndex - 1].id
      setEventStatus('playing')
      setIsAudioPlaying(true)
      await sequencer?.replayEvent(eventId)
      setEventStatus('complete')
      setIsAudioPlaying(false)
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

      {/* Audio Visualization */}
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
          className="text-lg py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-full transition-all duration-200"
        >
          Previous
        </Button>
        
        {eventStatus === 'complete' && (
          <Button
            onClick={replayCurrentEvent}
            disabled={isAudioPlaying}
            className="text-lg py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all duration-200"
          >
            Replay
          </Button>
        )}

        <Button
          onClick={goToNextEvent}
          disabled={currentEventIndex === events.length - 1 || isAudioPlaying}
          className="text-lg py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold rounded-full transition-all duration-200"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
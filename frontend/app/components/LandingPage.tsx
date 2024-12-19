'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LandingPageProps {
  onStart: () => void
}

interface ApiKeys {
  accessCode?: string;
  openaiKey?: string;
  elevenLabsKey?: string;
  replicateToken?: string;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [useAccessCode, setUseAccessCode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isValid = useAccessCode 
    ? apiKeys.accessCode === process.env.NEXT_PUBLIC_ACCESS_CODE
    : (!!apiKeys.openaiKey && !!apiKeys.elevenLabsKey && !!apiKeys.replicateToken);

  const handleSubmit = () => {
    setError(null);

    if (useAccessCode) {
      if (apiKeys.accessCode !== process.env.NEXT_PUBLIC_ACCESS_CODE) {
        setError('Invalid access code');
        return;
      }
    } else {
      const keyPattern = /^[a-zA-Z0-9-_]{20,}$/;
      if (!keyPattern.test(apiKeys.openaiKey || '') ||
          !keyPattern.test(apiKeys.elevenLabsKey || '') ||
          !keyPattern.test(apiKeys.replicateToken || '')) {
        setError('Invalid API key format');
        return;
      }
    }

    const keysToStore = useAccessCode 
      ? { accessCode: apiKeys.accessCode }
      : {
          openaiKey: apiKeys.openaiKey,
          elevenLabsKey: apiKeys.elevenLabsKey,
          replicateToken: apiKeys.replicateToken
        };

    localStorage.setItem('storylabs_keys', JSON.stringify(keysToStore));
    onStart();
  };

  return (
    <div className="text-center w-full min-h-screen flex flex-col items-center justify-center p-4">
      <motion.img
        src="/storylabs.png"
        alt="StoryLabs Logo"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-32 mb-4"
      />
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-6xl font-bold text-white mb-8"
      >
        StoryLabs
      </motion.h1>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white/10 backdrop-blur-sm p-6 rounded-lg max-w-md w-full"
      >
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={() => {
              setUseAccessCode(true);
              setError(null);
              setApiKeys({});
            }}
            variant={useAccessCode ? "default" : "outline"}
            className="w-1/2"
          >
            Access Code
          </Button>
          <Button
            onClick={() => {
              setUseAccessCode(false);
              setError(null);
              setApiKeys({});
            }}
            variant={!useAccessCode ? "default" : "outline"}
            className="w-1/2"
          >
            API Keys
          </Button>
        </div>

        <div className="space-y-4">
          {useAccessCode ? (
            <div>
              <Input
                placeholder="Enter Access Code"
                type="password"
                value={apiKeys.accessCode || ''}
                onChange={(e) => {
                  setApiKeys({ accessCode: e.target.value });
                  setError(null);
                }}
                className="bg-white/20 text-white placeholder:text-white/50"
              />
            </div>
          ) : (
            <>
              <Input
                placeholder="OpenAI API Key"
                value={apiKeys.openaiKey || ''}
                onChange={(e) => {
                  setApiKeys({ ...apiKeys, openaiKey: e.target.value });
                  setError(null);
                }}
                className="bg-white/20 text-white placeholder:text-white/50"
              />
              <Input
                placeholder="ElevenLabs API Key"
                value={apiKeys.elevenLabsKey || ''}
                onChange={(e) => {
                  setApiKeys({ ...apiKeys, elevenLabsKey: e.target.value });
                  setError(null);
                }}
                className="bg-white/20 text-white placeholder:text-white/50"
              />
              <Input
                placeholder="Replicate API Token"
                value={apiKeys.replicateToken || ''}
                onChange={(e) => {
                  setApiKeys({ ...apiKeys, replicateToken: e.target.value });
                  setError(null);
                }}
                className="bg-white/20 text-white placeholder:text-white/50"
              />
            </>
          )}
        </div>
      </motion.div>

      <AudioWaveform />
      
      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 mt-4 font-semibold"
        >
          {error}
        </motion.div>
      )}

      <motion.div className="text-white/70 text-sm mt-4">
        {useAccessCode 
          ? "Enter access code to use our API keys"
          : "Provide your own API keys for OpenAI, ElevenLabs, and Replicate"}
      </motion.div>

      <Button
        onClick={handleSubmit}
        size="lg"
        disabled={!isValid}
        className="mt-8 text-2xl py-6 px-8 rounded-full bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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


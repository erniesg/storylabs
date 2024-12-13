'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UserInputFormProps {
  onSubmit: (userInfo: { name: string; age: string; interests: string }) => void
}

export default function UserInputForm({ onSubmit }: UserInputFormProps) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [interests, setInterests] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, age, interests })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
    >
      <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">Tell us about yourself!</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
            What's your name?
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full text-lg py-2 px-3 border-2 border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label htmlFor="age" className="block text-lg font-medium text-gray-700 mb-2">
            How old are you?
          </label>
          <Input
            id="age"
            type="number"
            min="3"
            max="7"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            className="w-full text-lg py-2 px-3 border-2 border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label htmlFor="interests" className="block text-lg font-medium text-gray-700 mb-2">
            What do you like?
          </label>
          <Input
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            required
            className="w-full text-lg py-2 px-3 border-2 border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <Button
          type="submit"
          className="w-full text-xl py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold rounded-full transition-all duration-200 transform hover:scale-105"
        >
          Start My Story!
        </Button>
      </form>
    </motion.div>
  )
}


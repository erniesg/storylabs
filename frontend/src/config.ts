export const config = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    endpoints: {
      generateStory: '/api/story/generate',
      generateImage: '/api/story/generate-image',
      generateAudio: '/api/story/generate-audio',
    }
  }
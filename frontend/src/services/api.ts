// Directly set API URL based on environment
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://storylabs-api.onrender.com'  // Production URL
  : 'http://localhost:8000';              // Development URL

console.log('Environment:', process.env.NODE_ENV);
console.log('Using API_URL:', API_URL);

export const getStoredKeys = () => {
  try {
    const keys = localStorage.getItem('storylabs_keys');
    if (!keys) return null;
    const parsedKeys = JSON.parse(keys);
    console.log('Retrieved stored keys:', {
      accessCode: parsedKeys.accessCode ? 'Present' : 'Not present',
      openaiKey: parsedKeys.openaiKey ? 'Present' : 'Not present',
      elevenLabsKey: parsedKeys.elevenLabsKey ? 'Present' : 'Not present',
      replicateToken: parsedKeys.replicateToken ? 'Present' : 'Not present'
    });
    return parsedKeys;
  } catch (error) {
    console.error('Error getting stored keys:', error);
    localStorage.removeItem('storylabs_keys');
    return null;
  }
};

// Add error handling for API key validation
const validateApiResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    if (response.status === 403) {
      // Clear stored keys if authentication fails
      localStorage.removeItem('storylabs_keys');
    }
    throw new Error(error.detail || 'Request failed');
  }
  return response;
};

export const generateStory = async (userInfo: {
  name: string;
  age: string;
  interests: string;
}) => {
  const keys = getStoredKeys();
  if (!keys) {
    throw new Error('No credentials found');
  }

  // Add debug logging
  console.log('Sending request with headers:', {
    ...(keys.accessCode && { 'X-Access-Code': keys.accessCode }),
    ...(keys.openaiKey && { 'X-OpenAI-Key': keys.openaiKey }),
    ...(keys.elevenLabsKey && { 'X-ElevenLabs-Key': keys.elevenLabsKey }),
    ...(keys.replicateToken && { 'X-Replicate-Token': keys.replicateToken }),
  });

  try {
    const response = await fetch(`${API_URL}/api/story/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(keys.accessCode && { 'X-Access-Code': keys.accessCode }),
        ...(keys.openaiKey && { 'X-OpenAI-Key': keys.openaiKey }),
        ...(keys.elevenLabsKey && { 'X-ElevenLabs-Key': keys.elevenLabsKey }),
        ...(keys.replicateToken && { 'X-Replicate-Token': keys.replicateToken }),
      },
      body: JSON.stringify({
        child_name: userInfo.name,
        child_age: userInfo.age,
        child_interests: userInfo.interests
      })
    });

    await validateApiResponse(response);
    const data = await response.json();

    // Pass the stored keys to image generation
    const scenesWithImages = await Promise.all(data.story.scenes.map(async (scene: { prompt: string }) => {
      const imageUrl = await fetchGeneratedImage(scene.prompt, keys);
      return { ...scene, imageUrl };
    }));

    return {
      story: { ...data.story, scenes: scenesWithImages }
    };
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
};

export async function fetchGeneratedImage(prompt: string, keys: any): Promise<string> {
  const response = await fetch(`${API_URL}/api/story/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(keys.accessCode && { 'X-Access-Code': keys.accessCode }),
      ...(keys.openaiKey && { 'X-OpenAI-Key': keys.openaiKey }),
      ...(keys.elevenLabsKey && { 'X-ElevenLabs-Key': keys.elevenLabsKey }),
      ...(keys.replicateToken && { 'X-Replicate-Token': keys.replicateToken }),
    },
    body: JSON.stringify({ prompt: prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  const imagePath = data.image_path;
  const imageUrl = `${API_URL}/${imagePath}`;
  return imageUrl;      
}

export async function playAudio(
  text: string, 
  voice: string = 'alloy', 
  provider: 'openai' | 'elevenlabs' = 'elevenlabs'
): Promise<void> {
  console.log('🎧 Starting audio request:', { text, voice, provider });
  
  const keys = getStoredKeys();
  if (!keys) {
    throw new Error('No credentials found');
  }

  try {
    const startFetch = Date.now();
    const response = await fetch(`${API_URL}/api/story/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(keys.accessCode && { 'X-Access-Code': keys.accessCode }),
        ...(keys.openaiKey && { 'X-OpenAI-Key': keys.openaiKey }),
        ...(keys.elevenLabsKey && { 'X-ElevenLabs-Key': keys.elevenLabsKey }),
      },
      body: JSON.stringify({ 
        text,
        provider,
        ...(provider === 'openai' && { voice })
      }),
    });

    console.log('📡 Audio response received:', {
      status: response.status,
      latency: `${Date.now() - startFetch}ms`
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    // Create a MediaSource
    const mediaSource = new MediaSource();
    const audio = new Audio();
    audio.src = URL.createObjectURL(mediaSource);

    let chunksReceived = 0;
    const startStream = Date.now();

    return new Promise((resolve, reject) => {
      mediaSource.addEventListener('sourceopen', async () => {
        try {
          const reader = response.body!.getReader();
          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunksReceived++;
            
            // Wait for the buffer to be ready
            await new Promise(resolve => {
              if (!sourceBuffer.updating) resolve(null);
              else sourceBuffer.addEventListener('updateend', () => resolve(null), { once: true });
            });
            
            sourceBuffer.appendBuffer(value);
          }
          
          console.log('🎵 Stream complete:', {
            chunks: chunksReceived,
            duration: `${Date.now() - startStream}ms`
          });

          mediaSource.endOfStream();
          audio.play();
          
          audio.onended = () => {
            console.log('🏁 Audio playback complete');
            resolve();
          };
          audio.onerror = () => reject(new Error('Audio playback failed'));
        } catch (error) {
          console.error('❌ Streaming error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Audio error:', error);
    throw error;
  }
}
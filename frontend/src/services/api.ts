// Directly set API URL based on environment
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://storylabs-api.onrender.com'  // Production URL
  : 'http://localhost:8000';              // Development URL

console.log('Environment:', process.env.NODE_ENV);
console.log('Using API_URL:', API_URL);

export const getStoredKeys = () => {
  const keys = localStorage.getItem('storylabs_keys');
  return keys ? JSON.parse(keys) : null;
};

// Add error handling for API key validation
const validateApiResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
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

export async function playAudio(text: string) {
  const keys = getStoredKeys();
  if (!keys) {
    throw new Error('No credentials found');
  }

  try {
    const response = await fetch(`${API_URL}/api/story/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(keys.accessCode && { 'X-Access-Code': keys.accessCode }),
        ...(keys.openaiKey && { 'X-OpenAI-Key': keys.openaiKey }),
        ...(keys.elevenLabsKey && { 'X-ElevenLabs-Key': keys.elevenLabsKey }),
        ...(keys.replicateToken && { 'X-Replicate-Token': keys.replicateToken }),
      },
      body: JSON.stringify({ text: text }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}
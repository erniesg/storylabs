// frontend/src/services/api.ts

// Add more detailed debugging
console.log('Environment variables:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  all_env: process.env
});

// Add environment debugging
console.log('Environment Check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
});

// Use environment-aware API URL
export const API_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:8000';

console.log('Selected API_URL:', API_URL);

export const generateStory = async (userInfo: {
  name: string;
  age: string;
  interests: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/api/story/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        child_name: userInfo.name,
        child_age: userInfo.age,
        child_interests: userInfo.interests
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate story');
    }

    const data = await response.json();

    // Assuming data.scenes is an array of scenes with a 'prompt' field
    const scenesWithImages = await Promise.all(data.story.scenes.map(async (scene: { prompt: string }) => {
      const imageUrl = await fetchGeneratedImage(scene.prompt); // Changed from imageUrl to imagePath
      return { ...scene, imageUrl }; // Updated to use imageUrl
    }));
    console.log(`scenesWithImages: ${scenesWithImages}`);

    return {
        story: { ...data.story, scenes: scenesWithImages }
    };
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
};

export async function fetchGeneratedImage(prompt: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/story/generate-image`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt }),
  });

  if (!response.ok) {
      throw new Error('Failed to generate image');
  }

  // Assuming the server now returns a JSON object with the image path
  const data = await response.json();
  const imagePath = data.image_path; // Adjusted to expect a file path
  const imageUrl = `${API_URL}/${imagePath}`;
  console.log('Image URL:', imageUrl);
  return imageUrl;      
}

export async function playAudio(text: string) {
  try {
    const response = await fetch(`${API_URL}/api/story/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
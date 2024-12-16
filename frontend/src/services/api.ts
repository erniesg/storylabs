// frontend/src/services/api.ts
export const API_URL = 'http://127.0.0.1:8000';

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
    return {
        main: data.main,
        characters: data.characters,
        scenes: data.scenes
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
      body: JSON.stringify({ prompt: prompt}),
    });
  
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
  
    const blob = await response.blob();
    //log this url
    const imageUrl = URL.createObjectURL(blob);
    console.log('Image URL:', imageUrl);
    return imageUrl;
  }
import React, { useState, useEffect } from 'react';
import { fetchGeneratedImage } from '@/src/services/api';

interface ImageComponentProps {
  prompt: string;
}

const ImageComponent: React.FC<ImageComponentProps> = ({ prompt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const getImage = async () => {
      try {
        const url = await fetchGeneratedImage(prompt);
        if (isMounted) {
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    };

    getImage();

    return () => {
      isMounted = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [prompt]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      {imageUrl ? (
        <img src={imageUrl} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      ) : (
        <p>Loading image...</p>
      )}
    </div>
  );
};

export default ImageComponent;
// frontend/src/components/YourComponent.js
import { fetchStory } from '../services/api';

function YourComponent() {
  const [story, setStory] = useState(null);

  useEffect(() => {
    const getStory = async () => {
      try {
        const data = await fetchStory();
        setStory(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    getStory();
  }, []);

  return (
    // Your component JSX
    <div>
      <h1>Story</h1>
      <p>{story}</p>
    </div>
  );
}

export default GenerateStory;
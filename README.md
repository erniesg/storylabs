# StoryLabs

## Getting Started

### Prerequisites

- Docker installed on your machine

### Running with Docker

1. Create a .env file in the backend directory ./backend/.env with the following variables:
```
OPENAI_API_KEY=sk-svisdjt-XByasda11xxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=sk_22fb41exxxxxxxx
REPLICATE_API_TOKEN=r8_6Nb1nXjdmxxxxxxxx
```

2. Build the docker image and run the container:
   ```bash
   docker-compose up --build
   ```

3. Access the application at http://localhost:3000

### Troubleshooting Voice Generation

If you encounter a voice-related error (e.g., "voice_not_found"), you'll need to update the voice ID in your configuration:

1. Visit [ElevenLabs](https://elevenlabs.io/) and log in
2. Go to [Voices](https://elevenlabs.io/app/voice-lab)
3. Click "View" on the voice you'd like to use
4. Find and copy the Voice ID from the bottom right corner
5. Update the voice ID in `backend/app/api/endpoints/story.py`

### Online Demo

You can try StoryLabs online at [storylabs.onrender.com](https://storylabs.onrender.com)
- Note: Initial load may take ~1 minute for the instance to start
- Story generation typically takes about 1 minute
- Check browser console for progress updates

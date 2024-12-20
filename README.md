# StoryLabs

StoryLabs is a full-stack web app leveraging multimodal AI to engage and grow with young readers through stories.

## Tech Stack 🛠️

### Frontend 🎨
- Next.js
- Tailwind CSS
- Framer Motion

### Backend 🔧
- FastAPI
- Python

### AI Services 🤖
- OpenAI - Text generation and speech
- Replicate - Image generation
- ElevenLabs - Text-to-speech synthesis

## Getting Started

### Prerequisites

- Docker installed on your machine

### Running Locally with Docker

1. Create a .env file in the backend directory `./backend/.env` with the following variables:
```
OPENAI_API_KEY=your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key
REPLICATE_API_TOKEN=your-replicate-key
ACCESS_CODE=your-chosen-access-code
```

2. Create a .env file in the frontend directory `./frontend/.env.local` with:
```
NEXT_PUBLIC_ACCESS_CODE=your-chosen-access-code
```
Note: Use the same access code value in both files.

3. Build and run the development containers:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

4. Access the application at http://localhost:3000

### Using the Application

1. When you first open the application, you'll be prompted for an access code
2. Enter the access code you defined in your environment variables
3. The application will use the system's API keys for all operations

### Online Demo

You can try StoryLabs online at [storylabs.onrender.com](https://storylabs.onrender.com)
- Note: Initial load may take ~1 minute for the instance to start
- Story generation typically takes about 1 minute
- Check browser console for progress updates

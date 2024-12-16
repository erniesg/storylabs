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
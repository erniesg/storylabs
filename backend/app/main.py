from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import story
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # Adjust this to your needs
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

# Include routers
app.include_router(story.router, prefix="/api/story", tags=["story"])
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import story
import logging
import os

logger = logging.getLogger(__name__)

app = FastAPI()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

#make images directory if it doesn't exist
os.makedirs("images", exist_ok=True)

# Mount the images directory to serve static files
app.mount("/images", StaticFiles(directory="images"), name="images")

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
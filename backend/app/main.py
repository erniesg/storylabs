from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import story
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI()

#make images directory if it doesn't exist
os.makedirs("images", exist_ok=True)

# Mount the images directory to serve static files
app.mount("/images", StaticFiles(directory="images"), name="images")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CORS middleware with logging
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Include routers
app.include_router(story.router, prefix="/api/story", tags=["story"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting FastAPI application...")
    # Log all environment variables (last 3 chars only for security)
    for key in ["ACCESS_CODE", "OPENAI_API_KEY", "ELEVENLABS_API_KEY", "REPLICATE_API_TOKEN"]:
        value = os.environ.get(key)
        logger.info(f"{key} is {'SET (ends with ...' + value[-3:] + ')' if value else 'NOT SET'}")
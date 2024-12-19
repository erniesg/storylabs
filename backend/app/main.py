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
    # Log environment check (only last 3 chars for security)
    access_code = os.getenv("ACCESS_CODE")
    logger.info(f"ACCESS_CODE environment variable is {'SET (ends with ...' + access_code[-3:] + ')' if access_code else 'NOT SET'}")
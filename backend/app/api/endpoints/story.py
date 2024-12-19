from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from openai import OpenAI
from elevenlabs import ElevenLabs
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv
from app.storybuilder.config import model
from ..models.story_generation import Story
import logging
import replicate
from fastapi.responses import StreamingResponse
from io import BytesIO
from pathlib import Path
import time
from typing import Optional


logger = logging.getLogger(__name__)
load_dotenv()
router = APIRouter()

class StoryRequest(BaseModel):
    child_name: str
    child_age: int
    child_interests: str

#read in the config.py

# Add a function to validate and log credentials
def validate_credentials(
    x_access_code: Optional[str] = Header(None),
    x_openai_key: Optional[str] = Header(None),
    x_elevenlabs_key: Optional[str] = Header(None),
    x_replicate_token: Optional[str] = Header(None)
):
    logger.info("Validating credentials...")
    logger.info(f"Received headers: X-Access-Code: {'Present' if x_access_code else 'Not present'}")
    
    env_access_code = os.getenv("ACCESS_CODE")
    logger.info(f"System access code status: {'Present' if env_access_code else 'Not present'}")
    
    if x_access_code:
        logger.info(f"Comparing access codes (last 3 chars): Received ...{x_access_code[-3:]} vs System ...{env_access_code[-3:] if env_access_code else 'NONE'}")
        if x_access_code != env_access_code:
            logger.error("Access code mismatch!")
            raise HTTPException(status_code=403, detail="Invalid access code")
        logger.info("Access code validated successfully!")
    
    # If no access code, require all API keys
    if not all([x_openai_key, x_elevenlabs_key, x_replicate_token]):
        logger.error("Missing required API keys")
        raise HTTPException(status_code=403, detail="Must provide either access code or all API keys")
    
    # Use provided API keys
    logger.info("Using provided API keys:")
    logger.info(f"OpenAI key ending in: ...{x_openai_key[-3:]}")
    logger.info(f"ElevenLabs key ending in: ...{x_elevenlabs_key[-3:]}")
    logger.info(f"Replicate token ending in: ...{x_replicate_token[-3:]}")
    
    return {
        "openai_key": x_openai_key,
        "elevenlabs_key": x_elevenlabs_key,
        "replicate_token": x_replicate_token
    }

@router.post("/generate")
async def generate_story(
    request: StoryRequest,
    credentials: dict = Depends(validate_credentials)
):
    try:
        client = OpenAI(api_key=credentials["openai_key"])
        # Load the generator prompt
        with open('app/storybuilder/prompts/generator.txt', 'r') as file:
            md_generator_prompt = file.read()

        completion = client.beta.chat.completions.parse(
            model=model,
            messages=[{
                "role": "system", 
                "content": md_generator_prompt
            }, {
                "role": "user", 
                "content": f"Generate a story for a {request.child_age} year old child named {request.child_name} who is interested in {request.child_interests}."
            }],
            response_format=Story,
        )
        logger.info(f"Story generation completed: {completion.choices[0].message.parsed}")
        return {
            "story": completion.choices[0].message.parsed,
            "metadata": {
                "child_name": request.child_name,
                "child_age": request.child_age,
                "child_interests": request.child_interests,
                "timestamp": datetime.now().isoformat(),
                "id": uuid.uuid4().hex
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ImageRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"
    output_format: str = "png"
    seed: int = 123457

@router.post("/generate-image")
async def generate_image(
    request: ImageRequest,
    credentials: dict = Depends(validate_credentials)
):
    try:
        # Log which Replicate token is being used
        token = credentials["replicate_token"]
        logger.info(f"Generating image using Replicate token ending in ...{token[-3:]}")
        
        replicate_client = replicate.Client(api_token=token)
        
        # Define the input for the model
        input_data = {
            "prompt": f"{request.prompt} In the style of children's book illustrator, Richard Scarry.",
            "prompt_upsampling": False,
            "aspect_ratio": request.aspect_ratio,
            "output_format": request.output_format,
            "seed": request.seed
        }
        
        # Run the model
        output = replicate_client.run(
            "black-forest-labs/flux-1.1-pro",
            input=input_data
        )
        
        # Read the file content
        file_content = output.read()
        
        # Save the image to a local file
        file_path = f"images/{int(time.time())}.png"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)

        # Return the file path as JSON
        return {"image_path": file_path}
        
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

client = ElevenLabs(
    api_key=os.environ["ELEVENLABS_API_KEY"],
)

class AudioRequest(BaseModel):
    text: str

def save_audio_from_generator(generator):
    audio_stream = BytesIO()
    for chunk in generator:
        audio_stream.write(chunk)
    audio_stream.seek(0)  # Reset the stream position to the beginning
    return audio_stream

@router.post("/generate-audio")
async def generate_audio(
    request: AudioRequest,
    credentials: dict = Depends(validate_credentials)
):
    try:
        # Log which ElevenLabs key is being used
        key = credentials["elevenlabs_key"]
        logger.info(f"Generating audio using ElevenLabs key ending in ...{key[-3:]}")
        
        client = ElevenLabs(api_key=key)
        
        # Generate the audio
        audio_generator = client.text_to_speech.convert(
            voice_id="cgSgspJ2msm6clMCkdW9",
            output_format="mp3_44100_128",
            text=request.text,
            model_id="eleven_multilingual_v2",
        )

        # Get the audio stream
        audio_stream = save_audio_from_generator(audio_generator)

        # Return the audio as a StreamingResponse
        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=output_audio.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
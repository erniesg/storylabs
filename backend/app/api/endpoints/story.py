from fastapi import APIRouter, HTTPException
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


logger = logging.getLogger(__name__)
load_dotenv()
router = APIRouter()

class StoryRequest(BaseModel):
    child_name: str
    child_age: int
    child_interests: str

#read in the config.py

@router.post("/generate")
async def generate_story(request: StoryRequest):
    try:
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
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
async def generate_image(request: ImageRequest):
    try:
        # Initialize the Replicate client
        replicate_client = replicate.Client(api_token=os.environ["REPLICATE_API_TOKEN"])
        
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
async def generate_audio(request: AudioRequest):
    try:
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
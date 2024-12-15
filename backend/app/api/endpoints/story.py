from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv
from app.storybuilder.config import model
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
        with open('app/storybuilder/prompts/generator.md', 'r') as file:
            md_generator_prompt = file.read()

        completion = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "system", 
                "content": md_generator_prompt
            }, {
                "role": "user", 
                "content": f"Generate a story for a {request.child_age} year old child named {request.child_name} who is interested in {request.child_interests}."
            }],
            stream=False,
        )

        return {
            "story": completion.choices[0].message.content,
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
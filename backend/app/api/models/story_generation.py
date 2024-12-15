from pydantic import BaseModel
from typing import List, Literal, Dict, Any, Optional

class Personality(BaseModel):
    trait: str
    goal: str
    speech_style: str

class Character(BaseModel):
    name: str
    prompt: str
    voice: Literal["alloy", "echo", "shimmer", "ash", "ballad", "coral", "sage", "verse", "nova"]
    personality: Personality

class StoryEvent(BaseModel):
    type: Literal["narrate", "speak", "input"]
    character: Optional[Character] = None  # correct syntax    text: str
    emotion: Optional[str] = None
    prompt: Optional[str] = None
    content: Optional[str] = None
    id: str
    order: int  # Add this field

class Scene(BaseModel):
    name: str
    id: str
    prompt: str
    mood: str
    time: str
    events: List[StoryEvent]

class GlobalState(BaseModel):
    words_learned: List[str]

class StoryState(BaseModel):
    global_state: GlobalState

class Main(BaseModel):
    title: str
    flow: List[str]
    state: StoryState

class Story(BaseModel):
    main: Main
    characters: List[Character]
    scenes: List[Scene]
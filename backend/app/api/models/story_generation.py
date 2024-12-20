from pydantic import BaseModel, validator
from typing import List, Literal, Dict, Any, Optional
from collections import Counter

class Personality(BaseModel):
    trait: str
    goal: str
    speech_style: str

class Character(BaseModel):
    name: str
    prompt: str
    voice: Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    personality: Personality

class StoryEvent(BaseModel):
    type: Literal["narrate", "speak"]
    character: str
    voice: Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    emotion: str
    content: str
    id: str
    order: int

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

    @validator('characters')
    def validate_storyteller_and_voices(cls, characters):
        """Ensure Storyteller uses alloy and all voices are unique"""
        # Check Storyteller presence and voice
        if 'Storyteller' not in [char.name for char in characters]:
            raise ValueError("Story must have a Storyteller character")
        
        storyteller = next(char for char in characters if char.name == 'Storyteller')
        if storyteller.voice != "alloy":
            raise ValueError("Storyteller must use 'alloy' voice")
        
        # Check for duplicate voices
        voice_counts = Counter(char.voice for char in characters)
        duplicate_voices = [voice for voice, count in voice_counts.items() if count > 1]
        
        if duplicate_voices:
            # Create mapping of duplicate voices to character names
            voices_and_chars = {
                voice: [char.name for char in characters if char.voice == voice] 
                for voice in duplicate_voices
            }
            raise ValueError(
                f"Found duplicate voices: "
                f"{', '.join(f'{voice} used by {chars}' for voice, chars in voices_and_chars.items())}"
            )
        
        return characters

    @validator('scenes')
    def validate_voice_consistency(cls, scenes, values):
        """Validate voice consistency for defined characters"""
        if 'characters' not in values:
            return scenes
            
        # Create mapping of character names to their assigned voices
        char_voices = {char.name: char.voice for char in values['characters']}
        
        for scene in scenes:
            for event in scene.events:
                # If character is defined, ensure voice matches
                if event.character in char_voices:
                    expected_voice = char_voices[event.character]
                    if event.voice != expected_voice:
                        raise ValueError(
                            f"Voice mismatch: {event.character} uses '{event.voice}' "
                            f"but should use '{expected_voice}'"
                        )
                
                # Validate narration only for known Storyteller
                if event.type == "narrate" and event.character in char_voices:
                    if event.character != "Storyteller":
                        raise ValueError(f"Only Storyteller can narrate, not {event.character}")
        
        return scenes
// SceneParser.ts
export interface Character {
  name: string;
  prompt: string;
  voice: "alloy" | "echo" | "shimmer" | "ash" | "ballad" | "coral" | "sage" | "verse" | "nova";
  personality: {
    trait: string;
    goal: string;
    speech_style: string;
  };
}

export interface StoryEvent {
  type: 'narrate' | 'speak' | 'input';
  character?: {
    name: string;
    prompt: string;
    voice: string;
    personality: {
      trait: string;
      goal: string;
      speech_style: string;
    };
  };
  content: string;
  emotion?: string;
  id: string;
  order: number;
}

export interface ParsedScene {
  id: string;
  name: string;
  prompt: string;
  mood: string;
  time: string;
  imageUrl: string;
  events: StoryEvent[];
}
export class SceneParser {
  private characters: Map<string, Character> = new Map();
  private scenes: Map<string, ParsedScene> = new Map();
  constructor(charactersMarkdown: string) {
    this.parseCharacters(charactersMarkdown);
  }

  private validateCharacter(character: Partial<Character>): boolean {
    return !!(
      character.name &&
      character.prompt &&
      character.voice &&
      character.personality?.trait &&
      character.personality?.goal &&
      character.personality?.speech_style
    );
  }

  private parseCharacters(markdown: string): void {
    const lines = markdown.split('\n');
    let currentCharacter: Partial<Character> | null = null;

    for (const line of lines) {
      if (!line.trim() || line.startsWith('#')) continue;

      if (line.startsWith('@character:')) {
        if (currentCharacter?.name && this.validateCharacter(currentCharacter)) {
          this.characters.set(currentCharacter.name, currentCharacter as Character);
        }
        currentCharacter = {
          name: line.split('@character:')[1].trim()
        };
      } else if (line.startsWith('prompt:') && currentCharacter) {
        currentCharacter.prompt = line.split('prompt:')[1].trim();
      } else if (line.startsWith('voice:') && currentCharacter) {
        currentCharacter.voice = line.split('voice:')[1].trim() as Character['voice'];
      } else if (line.startsWith('personality:') && currentCharacter) {
        try {
          const personalityStr = line.split('personality:')[1].trim();
          const cleanJson = personalityStr.replace(/\s+/g, ' ').trim();
          currentCharacter.personality = JSON.parse(cleanJson);
        } catch (e) {
          console.error(`Error parsing personality for character ${currentCharacter.name}:`, e);
          currentCharacter.personality = {
            trait: "friendly",
            goal: "help tell the story",
            speech_style: "clear and warm"
          };
        }
      }
    }
    
    if (currentCharacter?.name && this.validateCharacter(currentCharacter)) {
      this.characters.set(currentCharacter.name, currentCharacter as Character);
    }

    console.log('Parsed characters:', Array.from(this.characters.entries()));
  }

  public parseScene(sceneData: any): ParsedScene {
    const events: StoryEvent[] = sceneData.events.map((event: any) => ({
      type: event.type,
      character: event.character ? {
        name: event.character.name,
        prompt: event.character.prompt,
        voice: event.character.voice,
        personality: event.character.personality,
      } : undefined,
      text: event.text,
      emotion: event.emotion || '',
      id: event.id,
      order: event.order,
    }));
  
    return {
      id: sceneData.id,
      name: sceneData.name,
      prompt: sceneData.prompt,
      mood: sceneData.mood,
      time: sceneData.time,
      imageUrl: sceneData.imageUrl,
      events,
    };
  }

  public getCharacter(name: string): Character | undefined {
    return this.characters.get(name);
  }

  public getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }
}
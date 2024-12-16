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
  character?: Character;
  text: string;
  emotion?: string;
  id: string;
}

export interface ParsedScene {
  id: string;
  scene: string;
  events: StoryEvent[];
  prompt: string; // Added prompt property
}

export class SceneParser {
  private characters: Map<string, Character> = new Map();

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
      character: this.characters.get(event.character?.name) || undefined,
      content: event.content,
      emotion: event.emotion || '',
      id: event.id,
    }));

    return {
      id: sceneData.id,
      scene: sceneData.name,
      events,
      prompt: sceneData.prompt, // Ensure prompt is included
    };
  }

  public getCharacter(name: string): Character | undefined {
    return this.characters.get(name);
  }

  public getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }
}
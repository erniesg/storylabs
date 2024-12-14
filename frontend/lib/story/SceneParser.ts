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
      // Skip empty lines and comments
      if (!line.trim() || line.startsWith('#')) continue;

      if (line.startsWith('@character:')) {
        // Save previous character if exists and valid
        if (currentCharacter?.name && this.validateCharacter(currentCharacter)) {
          this.characters.set(currentCharacter.name, currentCharacter as Character);
        }
        // Start new character
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
          // Remove any extra whitespace and ensure valid JSON
          const cleanJson = personalityStr.replace(/\s+/g, ' ').trim();
          currentCharacter.personality = JSON.parse(cleanJson);
        } catch (e) {
          console.error(`Error parsing personality for character ${currentCharacter.name}:`, e);
          // Set default personality if parsing fails
          currentCharacter.personality = {
            trait: "friendly",
            goal: "help tell the story",
            speech_style: "clear and warm"
          };
        }
      }
    }
    
    // Save last character if valid
    if (currentCharacter?.name && this.validateCharacter(currentCharacter)) {
      this.characters.set(currentCharacter.name, currentCharacter as Character);
    }

    // Log parsed characters for debugging
    console.log('Parsed characters:', Array.from(this.characters.entries()));
  }

  public parseScene(markdown: string): ParsedScene {
    const lines = markdown.split('\n');
    const events: StoryEvent[] = [];
    let sceneId = '';
    let sceneName = '';

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line.trim() || line.startsWith('#')) continue;

      if (line.startsWith('@scene:')) {
        sceneName = line.split('@scene:')[1].trim();
      } else if (line.startsWith('@id:')) {
        sceneId = line.split('@id:')[1].trim();
      } else if (line.startsWith('@narrate')) {
        // Next line should be the narration text
        const textLine = lines[lines.indexOf(line) + 1];
        if (textLine && textLine.startsWith('"')) {
          events.push({
            type: 'narrate',
            character: this.characters.get('Narrator'),
            text: textLine.replace(/"/g, '').trim(),
            id: `${sceneId}_narrate_${events.length}`
          });
        }
      } else if (line.startsWith('@speak:')) {
        const characterName = line.split('@speak:')[1].trim();
        const character = this.characters.get(characterName);
        
        // Check for emotion tag
        const emotionLine = lines[lines.indexOf(line) + 1];
        let emotion = '';
        let textLineIndex = lines.indexOf(line) + 1;
        
        if (emotionLine && emotionLine.startsWith('[emotion:')) {
          emotion = emotionLine.match(/\[emotion:\s*([^\]]+)\]/)?.[1] || '';
          textLineIndex++;
        }

        const textLine = lines[textLineIndex];
        if (textLine && textLine.startsWith('"') && character) {
          events.push({
            type: 'speak',
            character,
            text: textLine.replace(/"/g, '').trim(),
            emotion,
            id: `${sceneId}_speak_${events.length}`
          });
        }
      } else if (line.startsWith('@input')) {
        const textLine = lines[lines.indexOf(line) + 1];
        if (textLine && textLine.startsWith('"')) {
          events.push({
            type: 'input',
            text: textLine.replace(/"/g, '').trim(),
            id: `${sceneId}_input_${events.length}`
          });
        }
      }
    }

    // Log parsed scene for debugging
    console.log('Parsed scene:', {
      id: sceneId,
      scene: sceneName,
      eventCount: events.length,
      events: events
    });

    return {
      id: sceneId,
      scene: sceneName,
      events
    };
  }

  // Helper method to get a character by name
  public getCharacter(name: string): Character | undefined {
    return this.characters.get(name);
  }

  // Helper method to get all characters
  public getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }
}
// Export these interfaces
export interface Character {
  name: string;
  prompt: string;
  voice: "alloy" | "echo" | "shimmer" | "ash" | "ballad" | "coral" | "sage" | "verse";
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

  private parseCharacters(markdown: string): void {
    const lines = markdown.split('\n');
    let currentCharacter: Partial<Character> | null = null;

    for (const line of lines) {
      if (line.startsWith('@character:')) {
        // Save previous character if exists
        if (currentCharacter?.name) {
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
          const personalityStr = line.split('personality:')[1];
          currentCharacter.personality = JSON.parse(personalityStr);
        } catch (e) {
          console.error('Error parsing personality:', e);
        }
      }
    }
    // Save last character
    if (currentCharacter?.name) {
      this.characters.set(currentCharacter.name, currentCharacter as Character);
    }
  }

  public parseScene(markdown: string): ParsedScene {
    const lines = markdown.split('\n');
    const events: StoryEvent[] = [];
    let sceneId = '';
    let sceneName = '';

    for (const line of lines) {
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

    return {
      id: sceneId,
      scene: sceneName,
      events
    };
  }
}

// Example usage:
/*
const parser = new SceneParser(charactersMarkdown);
const scene = parser.parseScene(sceneMarkdown);

// scene will contain:
{
  id: "rocket_intro",
  scene: "rocket_pad",
  events: [
    {
      type: "narrate",
      character: { name: "Narrator", voice: "nova", ... },
      text: "Xavier, look! There's a special rocket ship...",
      id: "rocket_intro_narrate_0"
    },
    {
      type: "speak",
      character: { name: "Captain Zip", voice: "ash", ... },
      text: "Hello, space explorer Xavier!...",
      emotion: "welcoming",
      id: "rocket_intro_speak_1"
    },
    // ...
  ]
}
*/
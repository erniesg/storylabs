export interface Story {
    story: {
      main: {
        title: string;
        flow: string[];
        state: {
          global_state: Record<string, any>;
        };
      };
      characters: Array<{
        name: string;
        prompt: string;
        voice: "alloy" | "echo" | "shimmer" | "ash" | "ballad" | "coral" | "sage" | "verse" | "nova";
        personality: {
          trait: string;
          goal: string;
          speech_style: string;
        };
      }>;
      scenes: Array<{
        name: string;
        id: string;
        prompt: string;
        mood: string;
        time: string;
        imageUrl: string;
        events: Array<{
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
        }>;
      }>;
    };
    metadata: {
      child_name: string;
      child_age: string;
      child_interests: string;
      timestamp: string;
      id: string;
    };
  }
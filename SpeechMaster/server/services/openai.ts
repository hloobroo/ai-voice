export interface TTSOptions {
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "ash" | "coral" | "sage";
  speed: number;
  format: "mp3" | "wav" | "opus" | "aac" | "flac";
}

// Supported voices from the a4f-local implementation
const SUPPORTED_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "ash", "coral", "sage"];

// Headers to mimic browser request to openai.fm
const PROVIDER_HEADERS = {
  "accept": "*/*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "en-US,en;q=0.9,hi;q=0.8",
  "dnt": "1",
  "origin": "https://www.openai.fm",
  "referer": "https://www.openai.fm/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
};

const PROVIDER_URL = "https://www.openai.fm/api/generate";

export async function generateSpeech(text: string, options: TTSOptions): Promise<Buffer> {
  try {
    console.log(`Generating speech using openai.fm for voice: ${options.voice}`);
    
    // Validate voice support
    if (!SUPPORTED_VOICES.includes(options.voice)) {
      throw new Error(`Unsupported voice: ${options.voice}. Supported voices: ${SUPPORTED_VOICES.join(', ')}`);
    }
    
    // Log warning if speed is not 1.0 since openai.fm doesn't support speed parameter
    if (options.speed !== 1.0) {
      console.warn(`Speed parameter (${options.speed}) is not supported by openai.fm API. Using default speed.`);
    }
    
    // Construct voice prompt as done in a4f-local
    const voicePrompt = `Voice: ${options.voice}. Standard clear voice.`;
    
    // Prepare payload matching the a4f-local format
    const payload = new URLSearchParams({
      input: text,
      prompt: voicePrompt,
      voice: options.voice,
      vibe: "null"
    });
    
    console.log(`Calling openai.fm API with voice: ${options.voice}`);
    
    // Make the API request
    const response = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: {
        ...PROVIDER_HEADERS,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 500)}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Get the audio content as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Successfully received ${buffer.length} bytes of audio data from openai.fm`);
    return buffer;
    
  } catch (error) {
    console.error("Error generating speech with openai.fm:", error);
    throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function chunkText(text: string, maxChunkSize = 4000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // If adding this sentence would exceed the limit, start a new chunk
    if (currentChunk.length + trimmedSentence.length + 2 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      
      // If single sentence is too long, split it further
      if (trimmedSentence.length > maxChunkSize) {
        const words = trimmedSentence.split(" ");
        let wordChunk = "";
        
        for (const word of words) {
          if (wordChunk.length + word.length + 1 > maxChunkSize) {
            if (wordChunk) {
              chunks.push(wordChunk.trim());
              wordChunk = "";
            }
          }
          wordChunk += (wordChunk ? " " : "") + word;
        }
        
        if (wordChunk) {
          currentChunk = wordChunk;
        }
      } else {
        currentChunk = trimmedSentence;
      }
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

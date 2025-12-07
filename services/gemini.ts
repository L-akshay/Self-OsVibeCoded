import { 
  GoogleGenAI, 
  LiveServerMessage, 
  Modality, 
  GenerateContentResponse,
  Type,
  Blob
} from "@google/genai";
import { AGENT_PROMPTS } from '../constants';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Audio Utils for Live API ---
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  const binaryString = new Uint8Array(int16.buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return {
    data: btoa(binaryString), 
    mimeType: 'audio/pcm;rate=16000',
  }; 
}

// Just wrapping the encoding logic properly for the SDK object structure
function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Service Class ---

class GeminiService {
  
  // 1. Chat with Thinking Mode & Search
  async chatWithThinking(
    prompt: string, 
    imagePart?: { data: string, mimeType: string }
  ): Promise<{ text: string, thinking?: string, grounding?: string[] }> {
    
    // Determine model based on complexity. 
    // Using gemini-3-pro-preview for logic/reasoning.
    const modelId = 'gemini-3-pro-preview';

    const parts: any[] = [];
    if (imagePart) {
      parts.push({
        inlineData: {
          mimeType: imagePart.mimeType,
          data: imagePart.data
        }
      });
    }
    parts.push({ text: prompt });

    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: {
          thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking
          tools: [{ googleSearch: {} }] // Enable Grounding
        }
      });

      const text = response.text || "I couldn't generate a response.";
      
      // Extract grounding metadata if available
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingUrls = groundingChunks
        .map((c: any) => c.web?.uri)
        .filter((u: string) => !!u);
        
      // Extract thinking trace if available (implementation detail depends on final API exposure of thought chain)
      // Currently simulation or checking specific candidate parts
      const thinking = (response.candidates?.[0]?.content?.parts as any[])?.find(p => p.thought)?.thought || undefined;

      return { text, thinking, grounding: groundingUrls };

    } catch (e) {
      console.error("Chat error", e);
      return { text: "Error connecting to SELF-OS neural core." };
    }
  }

  // 2. Image Editing (Nano Banana)
  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Nano Banana / Flash Image
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: prompt }
          ]
        }
      });
      
      // Find image part
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Image edit error", e);
      return null;
    }
  }

  // 3. Image Generation (For Avatar)
  async generateImage(prompt: string): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Image generation error", e);
      return null;
    }
  }

  // 4. Extractor Agent (JSON Mode)
  async analyzeContent(content: string): Promise<any> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
        config: {
          systemInstruction: AGENT_PROMPTS.EXTRACTOR,
          responseMimeType: 'application/json',
          responseSchema: {
             type: Type.OBJECT,
             properties: {
               summary: { type: Type.STRING },
               tasks: { 
                 type: Type.ARRAY, 
                 items: {
                   type: Type.OBJECT,
                   properties: {
                     title: { type: Type.STRING },
                     priority: { type: Type.STRING }
                   }
                 }
               },
               sentiment: { type: Type.STRING }
             }
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Analysis error", e);
      return {};
    }
  }

  // 5. Live API Connection
  async connectLive(
    onAudioData: (buffer: AudioBuffer) => void,
    onTranscription: (text: string, isUser: boolean) => void,
    onClose: () => void
  ): Promise<(blob: Blob) => void> {
    
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    let nextStartTime = 0;

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => console.log("SELF-OS Live Connected"),
        onclose: () => {
          console.log("SELF-OS Live Closed");
          onClose();
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio Output
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
             const audioBuffer = await decodeAudioData(
               new Uint8Array(atob(base64Audio).split('').map(c => c.charCodeAt(0))), 
               outputAudioContext
             );
             
             // Simple queue management
             if (nextStartTime < outputAudioContext.currentTime) {
               nextStartTime = outputAudioContext.currentTime;
             }
             
             const source = outputAudioContext.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(outputAudioContext.destination);
             
             // Notify UI for visualization
             onAudioData(audioBuffer);
             
             source.start(nextStartTime);
             nextStartTime += audioBuffer.duration;
          }

          // Handle Transcriptions
          if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
             onTranscription(message.serverContent.modelTurn.parts[0].text, false);
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: "You are SELF-OS, a helpful, witty, and highly intelligent operating system avatar.",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });

    // Return a function to send audio blobs to the session
    return async (blob: Blob) => {
      const session = await sessionPromise;
      session.sendRealtimeInput({
        media: blob
      });
    };
  }

  // 6. Strategy Mind Map Generation
  async generateMindMap(goal: string): Promise<any> {
    try {
      const prompt = `I need a structured mind map to achieve this goal: "${goal}". 
      Break it down into a hierarchical tree structure. 
      Root node is the goal. Children are major steps. Their children are actionable sub-steps.
      Limit depth to 3 levels.
      Return JSON only matching this structure:
      {
        "name": "Goal",
        "children": [
          { "name": "Step 1", "children": [...] }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Mind map generation error", e);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
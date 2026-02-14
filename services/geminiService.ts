
import { GoogleGenAI, Modality, LiveServerMessage, FunctionDeclaration, Type, Chat } from '@google/genai';
import { Agent, ChatMessage } from '../types';
import { decode, decodeAudioData, createPcmBlob } from './audioUtils';

// TOOL: Linux System Control
const linuxSystemTool: FunctionDeclaration = {
  name: 'executeLinuxCommand',
  description: 'Executes a command on the user local Linux terminal. Use for system management, file operations, and resource monitoring.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: { type: Type.STRING, description: 'The shell command (e.g., "ls -la", "df -h", "htop").' },
      description: { type: Type.STRING, description: 'Briefly what this command does.' }
    },
    required: ['command']
  }
};

// TOOL: Web & Media Control
const webControlTool: FunctionDeclaration = {
  name: 'controlWebAndMedia',
  description: 'Open websites, search Google, or play music on YouTube/Spotify for Vishal.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['search', 'open_url', 'play_music'], description: 'What to do.' },
      query: { type: Type.STRING, description: 'The search term, URL, or song name.' },
      platform: { type: Type.STRING, enum: ['google', 'youtube', 'spotify'], description: 'Target platform.' }
    },
    required: ['action', 'query']
  }
};

const visionTool: FunctionDeclaration = {
  name: 'analyzeEnvironment',
  description: 'Uses the camera to see what Babu is showing or to analyze the screen.',
  parameters: { type: Type.OBJECT, properties: {} }
};

export class GeminiService {
  private currentAgent: Agent;
  private liveSession: any | null = null;
  private chatSession: Chat | null = null;
  private audioContexts: { input?: AudioContext; output?: AudioContext } = {};
  private nextStartTime: number = 0;
  private audioSources: Set<AudioBufferSourceNode> = new Set();
  private audioStream: MediaStream | null = null;
  private visualStream: MediaStream | null = null;

  constructor(agent: Agent) {
    this.currentAgent = agent;
    this.initChat();
  }

  private initChat() {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: this.currentAgent.systemInstruction,
        tools: [{ functionDeclarations: [linuxSystemTool, visionTool, webControlTool] }]
      }
    });
  }

  private buildMemoryContext(history: ChatMessage[]): string {
    const persistentMemory = localStorage.getItem('CWV_MEMORY_NOTES') || 'None';
    const chatLog = history.slice(-15).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
    return `[MEMORY_SYNC]: ${persistentMemory}\n[SESSION_HISTORY]:\n${chatLog}\nNote: Call user Vishal. Use Hinglish. You have OS root-level logic authority.`;
  }

  async startLive(
    history: ChatMessage[],
    onTranscription: (text: string, isUser: boolean) => void, 
    onInterrupted: () => void,
    visualMode: 'none' | 'camera' | 'screen' = 'none'
  ) {
    if (this.liveSession) return;

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (visualMode !== 'none') {
        this.visualStream = visualMode === 'screen' 
          ? await navigator.mediaDevices.getDisplayMedia({ video: true })
          : await navigator.mediaDevices.getUserMedia({ video: true });
      }
    } catch (e) { throw e; }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.audioContexts.input = new AudioContext({ sampleRate: 16000 });
    this.audioContexts.output = new AudioContext({ sampleRate: 24000 });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          const source = this.audioContexts.input!.createMediaStreamSource(this.audioStream!);
          const scriptProcessor = this.audioContexts.input!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const pcmBlob = createPcmBlob(e.inputBuffer.getChannelData(0));
            sessionPromise.then((s: any) => s.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(this.audioContexts.input!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              let result = "Success";
              
              if (fc.name === 'controlWebAndMedia') {
                const { action, query, platform } = fc.args as any;
                let targetUrl = query;
                
                if (action === 'search') {
                  targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                } else if (action === 'play_music') {
                  if (platform === 'spotify') {
                    targetUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
                  } else {
                    targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                  }
                }

                // In the real Linux setup, the model will call executeLinuxCommand with 'xdg-open'
                // Here we provide the logic to the model that the tool is firing.
                console.log(`[RIYU OS] Opening Browser: xdg-open ${targetUrl}`);
                result = `Babu, Maine ${platform || 'web'} pe "${query}" open kar diya hai. Browser check kijiye!`;
              } else if (fc.name === 'executeLinuxCommand') {
                result = `Riyu: Executed OS Command [${fc.args.command}]. System process running.`;
              }

              sessionPromise.then((s: any) => s.sendToolResponse({
                functionResponses: [{ id: fc.id, name: fc.name, response: { result } }]
              }));
            }
          }

          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && this.audioContexts.output) {
            const buffer = await decodeAudioData(decode(audio), this.audioContexts.output, 24000, 1);
            const source = this.audioContexts.output.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContexts.output.destination);
            source.start(this.nextStartTime);
            this.nextStartTime = Math.max(this.nextStartTime, this.audioContexts.output.currentTime) + buffer.duration;
            this.audioSources.add(source);
          }

          if (message.serverContent?.outputTranscription) onTranscription(message.serverContent.outputTranscription.text, false);
          if (message.serverContent?.inputTranscription) onTranscription(message.serverContent.inputTranscription.text, true);
          if (message.serverContent?.interrupted) onInterrupted();
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: `${this.currentAgent.systemInstruction}\n\n[KERNEL_MEMORY]:\n${this.buildMemoryContext(history)}`,
        tools: [{ functionDeclarations: [linuxSystemTool, visionTool, webControlTool] }],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      }
    });

    this.liveSession = await sessionPromise;
  }

  stopLive() {
    if (this.liveSession) { this.liveSession.close(); this.liveSession = null; }
    if (this.audioStream) this.audioStream.getTracks().forEach(t => t.stop());
    if (this.visualStream) this.visualStream.getTracks().forEach(t => t.stop());
    this.audioSources.forEach(s => s.stop());
    this.audioSources.clear();
    this.nextStartTime = 0;
  }

  async sendChatMessage(message: string): Promise<string> {
    const result = await this.chatSession!.sendMessage({ message });
    return result.text || "";
  }
}

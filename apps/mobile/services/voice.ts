import { useAuthStore } from '../stores/auth.store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace('http', 'ws');

export class VoiceClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private onTranscript: (text: string) => void;
  private onResponse: (text: string) => void;
  private onStatus: (status: string) => void;
  private onError: (error: string) => void;

  constructor(callbacks: {
    onTranscript: (text: string) => void;
    onResponse: (text: string) => void;
    onStatus: (status: string) => void;
    onError: (error: string) => void;
  }) {
    this.onTranscript = callbacks.onTranscript;
    this.onResponse = callbacks.onResponse;
    this.onStatus = callbacks.onStatus;
    this.onError = callbacks.onError;
  }

  async connect(): Promise<void> {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) throw new Error('Not authenticated');

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${WS_URL}/voice/ws`);

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({ type: 'auth', token: accessToken }));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'authenticated':
              this.sessionId = msg.sessionId;
              this.onStatus('connected');
              resolve();
              break;
            case 'transcript':
              this.onTranscript(msg.content);
              break;
            case 'response':
              this.onResponse(msg.content);
              this.onStatus('idle');
              break;
            case 'status':
              this.onStatus(msg.status);
              break;
            case 'error':
              this.onError(msg.message);
              break;
          }
        } catch {
          this.onError('Failed to parse server message');
        }
      };

      this.ws.onerror = () => {
        this.onError('WebSocket connection failed');
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        this.onStatus('disconnected');
        this.sessionId = null;
      };
    });
  }

  sendText(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.onError('Not connected');
      return;
    }
    this.onStatus('processing');
    this.ws.send(JSON.stringify({ type: 'text', content: message }));
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.onStatus('listening');
    this.ws.send(JSON.stringify({ type: 'audio', data: Array.from(new Uint8Array(audioData)) }));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

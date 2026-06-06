export interface Participant {
  id: string;
  sessionId: string;
  alias: string;
  color: string;
  shape: string;
  isSpeaking: boolean;
  hasActiveVoice: boolean;
}

export interface MessageSender {
  id: string;
  sessionId: string;
  alias: string;
  color: string;
  shape: string;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
  isBurn: boolean;
  burnTimer: number; // in seconds (5, 10, 30)
  isSpoiler: boolean;
  mediaUrl?: string;
  mediaName?: string;
  mediaType?: 'image' | 'file';
}

export interface AudioSettings {
  pitch: number;    // slider: 0.5 to 2.0 (1.0 = normal)
  formant: number;  // slider: 0.5 to 2.0 (1.0 = normal)
  masking: 'none' | 'rain' | 'traffic' | 'cafe';
  naturalVoice: boolean;
}
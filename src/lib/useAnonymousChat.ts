import { useEffect, useRef, useState } from 'react';
import { Participant, Message, AudioSettings } from '../types';
import { createPitchShifterNode, createProceduralRain, createProceduralTraffic, createProceduralCafe } from './audioDsp';

// Standard 16kHz sample rate for highly-optimized voice transmissions
const TRANSMISSION_SAMPLE_RATE = 16000;

export function useAnonymousChat(hashtag: string, sessionId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myIdentity, setMyIdentity] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isMonitoringOwnVoice, setIsMonitoringOwnVoice] = useState(false);
  
  // Local mute list
  const [localMuted, setLocalMuted] = useState<Set<string>>(new Set());
  
  // Audio settings (DSP pitch and masking)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    pitch: 1.0,
    formant: 1.0,
    masking: 'none',
    naturalVoice: false
  });

  // Active vote state to render banners when vote-kicks occur
  const [currentVote, setCurrentVote] = useState<{
    targetSessionId: string;
    targetAlias: string;
    votesCount: number;
    requiredVotes: number;
    hasVoted: boolean;
  } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  
  // Audio Web Nodes Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pitchShifterNodeRef = useRef<any | null>(null);
  const dspProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const monitorGainNodeRef = useRef<GainNode | null>(null);
  const ttsOutputNodeRef = useRef<AudioNode | null>(null);
  
  // Procedural noise tracking for disposal (FR-3.3)
  const rainSourceRef = useRef<any | null>(null);
  const trafficSourceRef = useRef<any | null>(null);
  const cafeSourceRef = useRef<any | null>(null);
  const noiseGainNodeRef = useRef<GainNode | null>(null);

  // Playback queue timestamps to maintain a seamless, gapless voice feedback stream
  const peerAudioNextPlayTimesRef = useRef<Map<string, number>>(new Map());

  // Refs for state preservation in handlers to avoid closures locking
  const audioSettingsRef = useRef(audioSettings);
  audioSettingsRef.current = audioSettings;

  const localMutedRef = useRef(localMuted);
  localMutedRef.current = localMuted;

  // Initialize Socket Connection
  useEffect(() => {
    if (!hashtag) return;

    setLoading(true);
    setError(null);
    setConnected(false);

    // Verify block status from the server
    const checkBlobAndJoin = async () => {
      try {
        const response = await fetch(`/api/check-block?sessionId=${encodeURIComponent(sessionId)}&hashtag=${encodeURIComponent(hashtag)}`);
        const blockData = await response.json();
        if (blockData.blocked) {
          setError(`You are blocked from entering ${hashtag} for 24 hours. Remaining time: ${blockData.remainingHours || 12} hour(s)`);
          setLoading(false);
          return;
        }

        // Establish WS connection on dynamic URL (compatible with Dev app, production server)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('[WS] Connected to Server');
          setConnected(true);
          // Send join payload
          ws.send(JSON.stringify({
            type: 'join',
            hashtag,
            sessionId
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'assigned_identity':
                setMyIdentity(data.identity);
                setLoading(false);
                break;
              
              case 'init_state':
                setParticipants(data.participants);
                setLoading(false);
                break;

              case 'participants_update':
                setParticipants(data.participants);
                break;

              case 'user_joined':
                setParticipants(prev => {
                  const exists = prev.some(p => p.sessionId === data.participant.sessionId);
                  if (exists) return prev;
                  return [...prev, data.participant];
                });
                break;

              case 'user_left':
                setParticipants(prev => prev.filter(p => p.id !== data.id));
                // Update active voter counts
                setCurrentVote(prev => {
                  if (prev && prev.targetSessionId === data.sessionId) return null;
                  return prev;
                });
                break;

              case 'message':
                // Handle incoming text message
                setMessages(prev => {
                  const msgExists = prev.some(m => m.id === data.message.id);
                  if (msgExists) return prev;
                  return [...prev, data.message];
                });
                break;

              case 'voice_proxy_tts':
                // Speak incoming TTS payload
                setMessages(prev => {
                  const msgExists = prev.some(m => m.id === data.message.id);
                  if (msgExists) return prev;
                  return [...prev, {
                    ...data.message,
                    isBurn: false,
                    isSpoiler: false,
                    isTTS: true
                  } as any];
                });
                // Speak locally matching standard audio parameters
                speakTTSLocally(data.message.text, data.message.sender.sessionId);
                break;

              case 'user_voice_state':
                setParticipants(prev => prev.map(p => {
                  if (p.id === data.id) {
                    return { ...p, hasActiveVoice: data.hasActiveVoice, isSpeaking: data.isSpeaking };
                  }
                  return p;
                }));
                break;

              case 'vote_update':
                // Active vote-kick alerts tracking
                setCurrentVote(prev => {
                  const hasVoted = prev ? (prev.targetSessionId === data.targetSessionId ? prev.hasVoted : false) : false;
                  return {
                    targetSessionId: data.targetSessionId,
                    targetAlias: data.targetAlias,
                    votesCount: data.votesCount,
                    requiredVotes: data.requiredVotes,
                    hasVoted
                  };
                });
                break;

              case 'user_expelled':
                // Target has been kicked democratically
                setCurrentVote(null);
                setMessages(prev => [
                  ...prev,
                  {
                    id: Math.random().toString(),
                    sender: { id: 'system', sessionId: 'sys', alias: 'System Notice', color: '#747D8C', shape: 'star' },
                    text: `📢 ${data.alias} was democratically vote-kicked and banned from this room.`,
                    timestamp: Date.now(),
                    isBurn: false,
                    burnTimer: 0,
                    isSpoiler: false
                  }
                ]);
                break;

              case 'user_voice_muted':
                // Server tracking update
                break;

              case 'voice_chunk':
                // De-serializes & schedules playback of incoming voice traffic
                if (!localMutedRef.current.has(data.senderSessionId)) {
                  playIncomingVoiceBuffer(data.senderSessionId, data.audioData);
                }
                break;

              case 'kicked_out':
                setError(data.message);
                setConnected(false);
                setMyIdentity(null);
                cleanupAudio();
                break;

              case 'room_disbanded':
                setError(data.reason);
                setConnected(false);
                cleanupAudio();
                break;

              case 'blocked':
                setError(data.message);
                setConnected(false);
                cleanupAudio();
                break;
                
              default:
                break;
            }
          } catch (e) {
            console.error('[WS Message Error]', e);
          }
        };

        ws.onerror = (e) => {
          console.error('[WS] Connection error', e);
          setError('WebSocket failed to host chat room connection.');
          setLoading(false);
        };

        ws.onclose = () => {
          console.log('[WS] Connection closed');
          setConnected(false);
          setLoading(false);
        };

      } catch (err) {
        setError(`Failed to authenticate room permissions: ${err}`);
        setLoading(false);
      }
    };

    checkBlobAndJoin();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      cleanupAudio();
    };
  }, [hashtag, sessionId]);

  // Clean Audio Node references
  const cleanupAudio = () => {
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
      stopEnvironmentalMasking();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } catch(e) {}
    
    setIsBroadcasting(false);
    setIsMonitoringOwnVoice(false);
  };

  // Apply voice modulation parameters dynamically
  useEffect(() => {
    if (pitchShifterNodeRef.current) {
      pitchShifterNodeRef.current.setPitch(audioSettings.pitch);
      if (typeof pitchShifterNodeRef.current.setBypass === 'function') {
        pitchShifterNodeRef.current.setBypass(audioSettings.naturalVoice);
      }
    }
    // Update ambient audio settings
    updateEnvironmentalMasking();
  }, [audioSettings.pitch, audioSettings.naturalVoice, audioSettings.masking]);

  // Toggle mute state for peer locally
  const toggleLocalMute = (userSessionId: string) => {
    setLocalMuted(prev => {
      const next = new Set(prev);
      if (next.has(userSessionId)) {
        next.delete(userSessionId);
      } else {
        next.add(userSessionId);
      }
      return next;
    });
  };

  // Send chat message
  const sendChatMessage = (
    text: string, 
    options: { 
      isBurn: boolean; 
      burnTimer: number; 
      isSpoiler: boolean;
      mediaUrl?: string;
      mediaName?: string;
      mediaType?: 'image' | 'file';
    }
  ) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    socketRef.current.send(JSON.stringify({
      type: 'message',
      text,
      isBurn: options.isBurn,
      burnTimer: options.burnTimer,
      isSpoiler: options.isSpoiler,
      mediaUrl: options.mediaUrl,
      mediaName: options.mediaName,
      mediaType: options.mediaType
    }));
  };

  // Send TTS proxy payload
  const triggerTTSProxy = (text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: 'voice_proxy_tts',
      text
    }));
  };

  // Local synthesizers using standard SpeechSynthesis API.
  // Sets pitch and volume matching the user-designed credentials.
  const speakTTSLocally = (text: string, senderSessId: string) => {
    // Check if the sender is manually muted
    if (localMutedRef.current.has(senderSessId)) {
      return; // Do not voice localized TTS for privately muted users
    }

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        
        // Map user's modulation settings to TTS or fall back
        utter.pitch = audioSettingsRef.current.pitch; // range 0 to 2
        utter.rate = 1.0;
        utter.volume = 0.9;

        // Try getting a neutral/clear voice
        const voices = window.speechSynthesis.getVoices();
        const standardVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (standardVoice) {
          utter.voice = standardVoice;
        }

        window.speechSynthesis.speak(utter);
      }
    } catch(e) {
      console.warn('TTS playback failure', e);
    }
  };

  // Initiate vote-kick against peer
  const castVoteKickUser = (targetSessionId: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    socketRef.current.send(JSON.stringify({
      type: 'vote_kick',
      targetSessionId
    }));

    setCurrentVote(prev => {
      if (prev && prev.targetSessionId === targetSessionId) {
        return { ...prev, hasVoted: true };
      }
      return prev;
    });
  };

  // Request bot simulator join to test things (such as local muting and democratic vote-kicks)
  const requestSimulationBot = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: 'bot_sim_request'
    }));
  };

  // Request bot chatbot response
  const triggerBotRoast = (botSessionId: string, targetSessionId?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: 'trigger_bot_roast',
      botSessionId,
      targetSessionId
    }));
  };

  /**
   * WEB AUDIO PROCESSING PIPELINE:
   * [Mic Stream] -> [Pre-mix Gain] -> [Pitch Shifter DSP Node] -> [Monitor Gain] -> [Speakers]
   *                        ^
   *            [Procedural Ambient Loops]
   */
  const startVoiceCapture = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 1. Fetch user microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;

      // 2. Clear out any legacy nodes before piping
      if (micSourceNodeRef.current) micSourceNodeRef.current.disconnect();
      if (pitchShifterNodeRef.current) pitchShifterNodeRef.current.disconnect();
      if (dspProcessorNodeRef.current) dspProcessorNodeRef.current.disconnect();

      // 3. Instantiate voice modulation DSP node
      micSourceNodeRef.current = ctx.createMediaStreamSource(stream);
      pitchShifterNodeRef.current = createPitchShifterNode(ctx, audioSettings.pitch);
      if (typeof pitchShifterNodeRef.current.setBypass === 'function') {
        pitchShifterNodeRef.current.setBypass(audioSettings.naturalVoice);
      }

      // 4. Create local monitor loop
      monitorGainNodeRef.current = ctx.createGain();
      // Initially muted or soft based on toggled variable
      monitorGainNodeRef.current.gain.setValueAtTime(isMonitoringOwnVoice ? 0.3 : 0.0, ctx.currentTime);

      // Create downsampling script processor to translate raw floats into lightweight binary packets
      const bufferSize = 4096; // captures periodic packet
      dspProcessorNodeRef.current = ctx.createScriptProcessor(bufferSize, 1, 1);
      
      const inputSampleRate = ctx.sampleRate;

      // Capture modulated chunks and send to other participants over WebSockets
      dspProcessorNodeRef.current.onaudioprocess = (e) => {
        const dspData = e.inputBuffer.getChannelData(0);
        
        // 1. Detect if user is actively speaking (simple gate threshold for UI status indicators)
        let isSpeaking = false;
        let sumSqr = 0;
        for (let i = 0; i < dspData.length; i++) {
          sumSqr += dspData[i] * dspData[i];
        }
        const rms = Math.sqrt(sumSqr / dspData.length);
        if (rms > 0.015) { // threshold gate filter
          isSpeaking = true;
        }

        // Send active voice metadata states
        notifyVoiceStateToServer(true, isSpeaking);

        // 2. Downsample Float32 down to optimized monophonic 16kHz Int16 to save bandwidth
        const chunk = downsampleTo16kPCM(dspData, inputSampleRate);
        const base64Audio = arrayBufferToBase64(chunk.buffer);

        // 3. Dispatch to WebSockets
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'voice_chunk',
            audioData: base64Audio,
            settings: audioSettingsRef.current
          }));
        }
      };

      // 5. Connect node streams
      micSourceNodeRef.current.connect(pitchShifterNodeRef.current);
      pitchShifterNodeRef.current.connect(monitorGainNodeRef.current);
      monitorGainNodeRef.current.connect(ctx.destination);

      // Route the Pitch Shifter output to the processing script downsampler
      pitchShifterNodeRef.current.connect(dspProcessorNodeRef.current);
      dspProcessorNodeRef.current.connect(ctx.destination);

      setIsBroadcasting(true);
      notifyVoiceStateToServer(true, false);

      // Apply active ambient overlays
      updateEnvironmentalMasking();

    } catch (err: any) {
      console.error('Failed to bind voice stream:', err);
      setError(`Microphone error: ${err.message || err}. Please check mic permissions and secure origin.`);
      setIsBroadcasting(false);
    }
  };

  const stopVoiceCapture = () => {
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (dspProcessorNodeRef.current) {
        dspProcessorNodeRef.current.disconnect();
        dspProcessorNodeRef.current = null;
      }
      if (pitchShifterNodeRef.current) {
        pitchShifterNodeRef.current.disconnect();
        pitchShifterNodeRef.current = null;
      }
      stopEnvironmentalMasking();
      notifyVoiceStateToServer(false, false);
      setIsBroadcasting(false);
    } catch(e){}
  };

  // Toggle monitoring own pitch output directly in headphones (useful to let users hear their voice-changing settings)
  const toggleVoiceMonitor = (active: boolean) => {
    setIsMonitoringOwnVoice(active);
    if (monitorGainNodeRef.current && audioContextRef.current) {
      monitorGainNodeRef.current.gain.setValueAtTime(active ? 0.35 : 0.0, audioContextRef.current.currentTime);
    }
  };

  // Notify server of visual presence talking animations
  const notifyVoiceStateToServer = (hasActiveVoice: boolean, isSpeaking: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'voice_state',
        hasActiveVoice,
        isSpeaking
      }));
    }
  };

  // Start environmental masking loop
  const updateEnvironmentalMasking = () => {
    const ctx = audioContextRef.current;
    if (!ctx || !isBroadcasting) return;

    stopEnvironmentalMasking();

    const maskingMode = audioSettings.masking;
    if (maskingMode === 'none') return;

    // Create a pipeline gain for injecting masking noise
    noiseGainNodeRef.current = ctx.createGain();
    // Keep ambient noise at a subtle level so it doesn't drown original vocal chords
    noiseGainNodeRef.current.gain.setValueAtTime(0.12, ctx.currentTime);

    // Dynamic routing: Noise -> pitchShifter to be transmitted, and subtle local output
    if (pitchShifterNodeRef.current) {
      noiseGainNodeRef.current.connect(pitchShifterNodeRef.current);
    }
    noiseGainNodeRef.current.connect(ctx.destination);

    if (maskingMode === 'rain') {
      const rain = createProceduralRain(ctx);
      rainSourceRef.current = rain.source;
      rain.output.connect(noiseGainNodeRef.current);
      rain.source.start();
    } else if (maskingMode === 'traffic') {
      const traffic = createProceduralTraffic(ctx);
      trafficSourceRef.current = traffic.source;
      traffic.output.connect(noiseGainNodeRef.current);
      traffic.source.start();
    } else if (maskingMode === 'cafe') {
      const cafe = createProceduralCafe(ctx);
      cafeSourceRef.current = cafe.source;
      cafe.output.connect(noiseGainNodeRef.current);
      cafe.source.start();
    }
  };

  const stopEnvironmentalMasking = () => {
    try {
      if (rainSourceRef.current) {
        rainSourceRef.current.stop();
        rainSourceRef.current = null;
      }
      if (trafficSourceRef.current) {
        trafficSourceRef.current.stop();
        trafficSourceRef.current = null;
      }
      if (cafeSourceRef.current) {
        cafeSourceRef.current.stop();
        cafeSourceRef.current = null;
      }
      if (noiseGainNodeRef.current) {
        noiseGainNodeRef.current.disconnect();
        noiseGainNodeRef.current = null;
      }
    } catch(e){}
  };

  /**
   * VOIP JITTER AUDIO PLAYBACK BUFFER (Gapless Voice Streaming Synthesis)
   * Receives incoming 16kHz base64 PCM array, rebuilds floats, and pipes
   * sequentially scheduled AudioBuffers to guarantee flawless stream.
   */
  const playIncomingVoiceBuffer = async (peerSessionId: string, base64Pcm: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Convert Base64 back to Float32 sample values
      const arrayBuffer = base64ToArrayBuffer(base64Pcm);
      const int16Array = new Int16Array(arrayBuffer);
      const float32Data = new Float32Array(int16Array.length);
      
      for (let i = 0; i < int16Array.length; i++) {
        // Map Int16 integers [-32768, 32767] back to [-1.0, 1.0] floats
        float32Data[i] = int16Array[i] / 32768;
      }

      // Create Web Audio Buffer
      const audioBuffer = ctx.createBuffer(1, float32Data.length, TRANSMISSION_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32Data);

      // Queue scheduling logic to avoid clipping and latency gaps
      const now = ctx.currentTime;
      let nextPlayTime = peerAudioNextPlayTimesRef.current.get(peerSessionId) || 0;

      // Jitter recovery: If delayed or out of sync, reset scheduling pointer safely
      if (nextPlayTime < now + 0.02) {
        nextPlayTime = now + 0.05; // 50ms buffer safety gap
      }

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);

      sourceNode.start(nextPlayTime);

      // Push advanced playback cue timestamp
      const duration = audioBuffer.duration;
      peerAudioNextPlayTimesRef.current.set(peerSessionId, nextPlayTime + duration);

    } catch (e) {
      console.warn('Voice playout error', e);
    }
  };

  // Helper: Linear downsampler interpolator
  const downsampleTo16kPCM = (buffer: Float32Array, inputSampleRate: number): Int16Array => {
    const sampleRateRatio = inputSampleRate / TRANSMISSION_SAMPLE_RATE;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    
    let offsetResult = 0;
    let offsetBuffer = 0;
    
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      
      const val = count > 0 ? accum / count : 0.0;
      // Convert Float to Int16 clip range
      result[offsetResult] = Math.max(-32768, Math.min(32767, val * 32767));
      
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    
    return result;
  };

  // Helper Binary conversions
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const burnMessageLocally = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return {
    loading,
    error,
    connected,
    myIdentity,
    participants,
    messages,
    localMuted,
    isBroadcasting,
    isMonitoringOwnVoice,
    audioSettings,
    currentVote,
    setAudioSettings,
    setError,
    toggleLocalMute,
    sendChatMessage,
    triggerTTSProxy,
    castVoteKickUser,
    requestSimulationBot,
    triggerBotRoast,
    startVoiceCapture,
    stopVoiceCapture,
    toggleVoiceMonitor,
    burnMessageLocally
  };
}

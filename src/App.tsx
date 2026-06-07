import React, { useState, useEffect, useRef } from 'react';
import { useAnonymousChat } from './lib/useAnonymousChat';
import { Identicon } from './components/Identicon';
import { MessageItem } from './components/MessageItem';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Flame,
  Eye,
  EyeOff,
  Users,
  Copy,
  PlusCircle,
  LogOut,
  HelpCircle,
  Hash,
  ShieldAlert,
  Sparkles,
  Radio,
  ChevronRight,
  UserX,
  Volume1,
  Paperclip,
  X,
  Smile,
  Cpu,
  Wifi,
  Camera,
  Cloud,
  Database,
  Activity,
  Workflow,
  CpuIcon
} from 'lucide-react';

// Pre-fill static trending hashtag categories to ease fast loading
const TRENDING_HASHTAGS = [
  'general',
  'gaming',
  'cyberpunk',
  'lofi-chill',
  'tech-talk',
  'crypto',
  'philosophy',
  'secret-scuttle'
];

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🤩', '🥳', '😏', '😳', '🤔', '🫣', '🤫', '🫡', '🤥', '🫠', '🤤']
  },
  {
    id: 'tech',
    label: 'Tech/Gaming',
    emojis: ['👾', '🎮', '💻', '🖥️', '📱', '📡', '🚀', '💥', '✨', '🔥', '⚡', '💯', '💀', '👽', '🤖', '👑', '⚔️', '🛡️', '💎', '🛠️', '⚙️', '💡', '🔔', '🔒', '🔮']
  },
  {
    id: 'hands',
    label: 'Reactions',
    emojis: ['👍', '👎', '👊', '✌️', '👌', '👋', '🤝', '🙌', '👏', '🫶', '🙏', '💪', '👀', '🧠', '💬', '💭', '📣', '🎉', '🎈', '🎁', '🔥', '❤️', '💖', '✨']
  },
  {
    id: 'nature',
    label: 'Vibes',
    emojis: ['🌸', '🍀', '🌲', '🌙', '☀️', '🪐', '🌟', '🌊', '❄️', '☕', '🍕', '🍔', '🍺', '🍷', '🎸', '🎧', '🎤', '🎨', '🎭', '⛺', '✈️', '🗺️', '🐾', '🐱', '🐶']
  }
];

// High-fidelity background render of PCB routes and interactive circuit node tracks
const CircuitBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25 z-0">
    <svg className="w-full h-full min-w-[1200px]" xmlns="http://www.w3.org/2000/svg">
      {/* Grid Pattern */}
      <defs>
        <pattern id="circuit-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#00E5FF" fillOpacity="0.12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit-grid)" />
      
      {/* Circuit Trace Path 1 (Cyan Neon Flow) */}
      <path 
        d="M 50 150 H 220 L 270 200 V 380 L 330 440 H 680 L 730 490 V 620 L 780 670 H 1150" 
        fill="none" 
        stroke="rgba(0, 229, 255, 0.25)" 
        strokeWidth="1.5" 
        className="circuit-path" 
      />
      {/* Glow Junction Nodes */}
      <circle cx="220" cy="150" r="3" fill="#00E5FF" className="animate-pulse" />
      <circle cx="270" cy="200" r="3" fill="#00A8FF" />
      <circle cx="330" cy="440" r="4" fill="#00E5FF" className="animate-ping" style={{ animationDuration: '3s' }} />
      <circle cx="330" cy="440" r="3" fill="#00E5FF" />
      <circle cx="680" cy="440" r="3.5" fill="#7B61FF" />
      <circle cx="730" cy="490" r="3" fill="#00E5FF" />
      <circle cx="780" cy="670" r="4" fill="#7B61FF" />

      {/* Circuit Trace Path 2 (Purple Neon Flow) */}
      <path 
        d="M 1200 180 H 1050 L 1000 230 V 420 L 950 470 H 600 L 550 520 V 680 H 150" 
        fill="none" 
        stroke="rgba(123, 97, 255, 0.22)" 
        strokeWidth="1.5" 
        className="circuit-path" 
      />
      <circle cx="1050" cy="180" r="3" fill="#7B61FF" />
      <circle cx="1000" cy="230" r="3" fill="#00E5FF" />
      <circle cx="950" cy="470" r="3.5" fill="#7B61FF" />
      <circle cx="600" cy="470" r="3" fill="#00A8FF" />
      <circle cx="550" cy="520" r="4" fill="#7B61FF" className="animate-ping" style={{ animationDuration: '4s' }} />
      <circle cx="550" cy="520" r="3" fill="#7B61FF" />
      <circle cx="150" cy="680" r="3.5" fill="#00E5FF" />

      {/* Auxiliary circuit paths */}
      <path d="M 100 800 L 250 650 H 420 L 470 600" fill="none" stroke="rgba(0, 168, 255, 0.15)" strokeWidth="1" className="circuit-path" />
      <path d="M 1100 700 L 920 880 H 750 V 950" fill="none" stroke="rgba(123, 97, 255, 0.12)" strokeWidth="1" className="circuit-path" />
    </svg>
  </div>
);

export default function App() {
  // Extract or generate temporary tab session ID
  const [sessionId] = useState(() => {
    const cached = sessionStorage.getItem('anon_tab_session_id');
    if (cached) return cached;
    const generated = 'sess-' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('anon_tab_session_id', generated);
    return generated;
  });

  // Extract from path or query or fallback
  const [hashtagInput, setHashtagInput] = useState(() => {
    const hash = window.location.hash;
    if (hash) return hash.replace('#', '');
    return '';
  });

  const [activeHashtag, setActiveHashtag] = useState(() => {
    const hash = window.location.hash;
    if (hash) return hash.replace('#', '').toLowerCase();
    return '';
  });

  // Chat message textbox
  const [textInput, setTextInput] = useState('');

  const [activeTheme, setActiveTheme] = useState<string>(() => localStorage.getItem('anon_active_theme') || 'cyberpunk');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const changeTheme = (newTheme: string) => {
    setActiveTheme(newTheme);
    localStorage.setItem('anon_active_theme', newTheme);
  };

  // Mobile Tab view state
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'peers' | 'dsp'>('chat');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Chat feature states
  const [isBurnMode, setIsBurnMode] = useState(false);
  const [burnTimer, setBurnTimer] = useState(10); // initial: 10s
  const [isSpoilerMode, setIsSpoilerMode] = useState(false);

  // Voice Proxy TTS textbox
  const [ttsInput, setTtsInput] = useState('');

  // Copy link feedback states
  const [copied, setCopied] = useState(false);

  // Auto-scroll ref
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Media attachment states
  const [attachedMedia, setAttachedMedia] = useState<{
    url: string;
    name: string;
    type: 'image' | 'file';
  } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom emoji section states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');

  // Floating incoming notification toast state when on different mobile tabs
  const [activeToast, setActiveToast] = useState<{ id: string; alias: string; text: string } | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit files to 2MB to keep communications speedy and friendly
    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large! Please upload files under 2MB to keep the zero-knowledge feed speedy.');
      return;
    }

    setIsUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith('image/');
      setAttachedMedia({
        url: reader.result as string,
        name: file.name,
        type: isImg ? 'image' : 'file'
      });
      setIsUploadingMedia(false);
    };
    reader.onerror = () => {
      alert('Failed to read the selected file.');
      setIsUploadingMedia(false);
    };
    reader.readAsDataURL(file);
  };

  // Bind Web Audio coordinates and WebSockets
  const chatEngine = useAnonymousChat(activeHashtag, sessionId);
  const {
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
  } = chatEngine;

  useEffect(() => {
    if (messages && messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (latest.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = latest.id;
        // Show toast on mobile if we're not inside the chat log tab and it's not our own message
        if (latest.sender.sessionId !== sessionId && isMobile && activeMobileTab !== 'chat') {
          setActiveToast({
            id: latest.id,
            alias: latest.sender.alias,
            text: latest.isSpoiler ? '🔒 [Spoiler]' : latest.text || '📁 File Attachment'
          });
          const timer = setTimeout(() => {
            setActiveToast(null);
          }, 3500);
          return () => clearTimeout(timer);
        }
      }
    } else {
      lastMessageIdRef.current = null;
    }
  }, [messages, isMobile, activeMobileTab, sessionId]);

  // Sync deep link hashes on navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveHashtag(hash.toLowerCase());
        setHashtagInput(hash);
      } else {
        setActiveHashtag('');
        setHashtagInput('');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync window hash when room is joined
  const joinRoomByHashtag = (tag: string) => {
    if (!tag) return;
    const clean = tag.replace('#', '').trim().toLowerCase();
    window.location.hash = `#${clean}`;
    setActiveHashtag(clean);
  };

  const leaveActiveRoom = () => {
    window.location.hash = '';
    setActiveHashtag('');
    setHashtagInput('');
    stopVoiceCapture();
  };

  // Keep chat scrolled bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handling Text Chat Submissions
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !attachedMedia) return;

    sendChatMessage(textInput, {
      isBurn: isBurnMode,
      burnTimer,
      isSpoiler: isSpoilerMode,
      mediaUrl: attachedMedia?.url,
      mediaName: attachedMedia?.name,
      mediaType: attachedMedia?.type
    });

    setTextInput('');
    setAttachedMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Reset transient triggers if single-use preferred
    setIsSpoilerMode(false);
  };

  const insertEmoji = (emoji: string) => {
    const input = document.getElementById('text-message-input') as HTMLInputElement | null;
    if (input) {
      const start = input.selectionStart ?? textInput.length;
      const end = input.selectionEnd ?? textInput.length;
      const updatedText = textInput.substring(0, start) + emoji + textInput.substring(end);
      setTextInput(updatedText);
      // Keep input focused, put cursor position directly after the inserted emoji
      setTimeout(() => {
        input.focus();
        const cursorPosition = start + emoji.length;
        input.setSelectionRange(cursorPosition, cursorPosition);
      }, 10);
    } else {
      setTextInput((prev) => prev + emoji);
    }
  };

  // Vocalize local Proxy TTS (FR-3.4)
  const handleSendTTSProxy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsInput.trim()) return;
    triggerTTSProxy(ttsInput);
    setTtsInput('');
  };

  // Multi-tab share link helper
  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/#${activeHashtag}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic DSP Range Descriptor HUD
  const getPitchDescriptor = (val: number) => {
    if (val <= 0.6) return '👿 Abyssal Underworld Demon';
    if (val <= 0.8) return '👹 Deep Cave Troll';
    if (val === 1.0) return '👤 Natural Vocal Identity';
    if (val >= 1.8) return '🧚 Enchanted Forest Fairy';
    if (val >= 1.4) return '🐿️ High-Frequency Chipmunk';
    return `🔊 Shifting Pitches (${val.toFixed(2)}x)`;
  };

  const getFormantDescriptor = (val: number) => {
    if (val <= 0.7) return '🗣️ Heavy Resonance (Masculine)';
    if (val === 1.1) return '🗣️ Neutral Formant (Linear)';
    if (val >= 1.5) return '🗣️ Nasal Shimmer (Feminine)';
    return `🗣️ Resonance Formants (${val.toFixed(2)}x)`;
  };

  // --- RENDERING PHASE ---

  // 1. Landing Portal View
  if (!activeHashtag) {
    return (
      <main className={`min-h-screen bg-deep-black flex flex-col items-center justify-center p-4 relative overflow-hidden tech-grid theme-${activeTheme}`} id="landing-portal">
        <CircuitBackground />
        
        {/* Glow vector decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-neon-purple/8 blur-[130px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-cyan/8 blur-[130px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />

        <div className="w-full max-w-xl glass-panel p-8 rounded-3xl relative z-10 flex flex-col gap-6 shadow-theme-glow border border-theme-accent-15" id="welcome-card">
          <div className="flex flex-col gap-2 items-center text-center">
            <span className="flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-mono font-semibold rounded-full bg-theme-accent-10 border border-theme-accent-30 text-theme-accent select-none tracking-wider uppercase animate-pulse">
              <Cpu className="w-3.5 h-3.5 text-neon-cyan" /> HARDWARE-LEVEL ENCRYPTION ACTIVE
            </span>
            <h1 className="text-4xl font-extrabold font-display tracking-tight text-white mt-1 uppercase text-center flex flex-col items-center">
              <span className="bg-gradient-to-r from-theme-accent to-theme-secondary bg-clip-text text-transparent glow-text-cyan">
                PRIVATECOMM
              </span>
              <span className="text-xs font-bold font-mono tracking-[0.3em] text-slate-400 mt-1 uppercase">
                Zero-Knowledge Ephemeral Audio/Text Deck
              </span>
            </h1>
            <p className="text-slate-400 text-[13px] max-w-md mt-2 leading-relaxed">
              Instantly construct volatile peer pipelines. Your voice frequency is scrambled at the DSP sensor level, leaving zero footprint in database records.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono rounded-xl flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} className="text-slate-400 hover:text-white shrink-0 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

          <form 
            onSubmit={(e) => { e.preventDefault(); joinRoomByHashtag(hashtagInput); }}
            className="flex flex-col gap-3 mt-2"
          >
            <label className="text-[10px] font-mono text-neon-cyan/80 flex items-center gap-1.5 font-bold tracking-wider uppercase">
              <Wifi className="w-4 h-4 text-neon-cyan" /> Establish Signal Link Point
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-theme-accent font-display font-semibold text-lg glow-text-cyan">#</span>
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="developer-mesh"
                className="w-full pl-9 pr-32 py-4 bg-deep-black/80 border border-slate-800 rounded-xl font-display font-medium text-white placeholder-slate-600 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent-20 transition-all text-sm tracking-wide"
                id="hashtag-enter-input"
              />
              <button
                type="submit"
                disabled={!hashtagInput.trim()}
                className="absolute right-2.5 px-4.5 py-2.5 rounded-lg bg-theme-accent-10 border border-theme-accent-30 text-theme-accent hover:brightness-110 disabled:opacity-35 disabled:hover:scale-100 font-mono text-xs font-bold uppercase transition-all duration-300 cursor-pointer shadow-theme-glow btn-interactive"
              >
                Join Deck
              </button>
            </div>
          </form>

          {/* Quick recommendations categories */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-neon-cyan animate-pulse" /> Active Channel Presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TRENDING_HASHTAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => joinRoomByHashtag(tag)}
                  className="flex items-center justify-between text-left px-4 py-3 rounded-xl border border-slate-800/60 bg-deep-black/60 hover:bg-slate-900/40 hover:border-theme-secondary-20 font-display text-xs text-slate-400 hover:text-white transition-all duration-300 cursor-pointer group card-hover-scale"
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                    <span className="font-semibold text-slate-300 group-hover:text-theme-accent transition-colors">#{tag}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-theme-accent" />
                </button>
              ))}
            </div>
          </div>

          {/* Electronics Inspired Component Disclosures */}
          <div className="border-t border-slate-800/80 pt-5 mt-2 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {/* RAM Disclosures */}
              <div className="bg-deep-black/80 border border-slate-800 p-3 rounded-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-theme-accent-30 transition-colors">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-theme-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-2 rounded-xl bg-theme-accent-10 border border-theme-accent-15 text-theme-accent mb-2">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="font-mono text-[9px] font-bold text-slate-200 uppercase tracking-wider">RAM MODULE</span>
                <span className="text-[10px] text-slate-500 mt-1 font-sans">100% Volatile State Only</span>
              </div>

              {/* Latency Disclosures */}
              <div className="bg-deep-black/80 border border-slate-800 p-3 rounded-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-electric-blue/40 transition-colors">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-electric-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-2 rounded-xl bg-electric-blue/5 border border-electric-blue/15 text-electric-blue mb-2">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-mono text-[9px] font-bold text-slate-200 uppercase tracking-wider">DSP CHIP</span>
                <span className="text-[10px] text-slate-500 mt-1 font-sans">&lt;15ms Voice Shifting</span>
              </div>

              {/* Access Disclosures */}
              <div className="bg-deep-black/80 border border-slate-800 p-3 rounded-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-neon-purple/40 transition-colors">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-2 rounded-xl bg-neon-purple/5 border border-neon-purple/15 text-neon-purple mb-2">
                  <Database className="w-4 h-4" />
                </div>
                <span className="font-mono text-[9px] font-bold text-slate-200 uppercase tracking-wider">SECURE GRID</span>
                <span className="text-[10px] text-slate-500 mt-1 font-sans">Zero Tracker Footprints</span>
              </div>
            </div>
            
            <p className="text-[11px] leading-relaxed text-slate-500 text-center max-w-sm mx-auto font-sans font-medium">
              Vocal pitch morphing, ambient environmental synthesizers, and ephemeral file relays run entirely client-side. Complete sovereign user containment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 2. Active Chatroom View
  return (
    <main className={`h-screen overflow-hidden bg-deep-black flex flex-col selection:bg-theme-accent-20 text-slate-200 relative tech-grid-dots theme-${activeTheme}`} id="chatroom-workspace">
      
      {/* FLOATING INCOMING MESSAGE TOAST OVERLAY */}
      {activeToast && (
        <div 
          type="button"
          onClick={() => {
            setActiveMobileTab('chat');
            setActiveToast(null);
          }}
          className="fixed top-18 left-4 right-4 z-50 p-3 bg-slate-950/95 border border-neon-cyan/40 hover:border-neon-cyan rounded-2xl flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(0,229,255,0.25)] backdrop-blur-md cursor-pointer transition-all duration-300"
          id="floating-incoming-toast"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest font-bold">New Signal Incoming</span>
              <p className="text-xs text-slate-200 font-sans truncate mt-0.5">
                <strong className="text-white font-semibold">{activeToast.alias}:</strong> {activeToast.text}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono text-neon-cyan shrink-0 font-bold uppercase tracking-wider bg-neon-cyan/10 border border-neon-cyan/20 px-2 py-1 rounded-lg">
            VIEW
          </span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="px-3 sm:px-5 py-4 border-b border-slate-800/50 bg-[#07090e]/60 backdrop-blur-xl flex items-center justify-between gap-1.5 sm:gap-4 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.4)]" id="chat-header">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="px-3 py-1.5 rounded-lg bg-theme-secondary-10 border border-theme-secondary-20 flex flex-shrink-0 items-center justify-center text-theme-accent font-mono text-xs sm:text-sm uppercase font-extrabold tracking-widest glow-text-cyan shadow-[inset_0_0_8px_rgba(var(--neon-secondary-rgb),0.2)]">
            #{activeHashtag}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 font-mono text-[11px] sm:text-xs text-slate-400 min-w-0">
            <Users className="w-4 h-4 text-neon-cyan flex-shrink-0" />
            <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="hidden sm:inline font-medium text-slate-300">{participants.length} SECURE PEER{participants.length === 1 ? '' : 'S'}</span>
              <span className="sm:hidden font-bold text-slate-300">{participants.length}P</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-theme-accent-10 border border-theme-accent-15 text-theme-accent text-[9px] sm:text-[10px] uppercase font-bold tracking-wider font-mono shrink-0 shadow-theme-glow">
                <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                1 MASKED
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Ambient Header Mic Toggle for instant voice scrambling */}
          <button
            onClick={isBroadcasting ? stopVoiceCapture : startVoiceCapture}
            className={`h-9 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs font-mono font-bold tracking-wider uppercase btn-interactive ${
              isBroadcasting 
                ? 'bg-theme-accent-10 border-theme-accent-30 text-theme-accent shadow-theme-glow' 
                : 'bg-theme-secondary-10 border-theme-secondary-20 text-theme-secondary hover:bg-theme-secondary-10 hover:text-white'
            }`}
            title={isBroadcasting ? "Turn Off Live Voice Scrambler" : "Turn On Live Voice Scrambler"}
            id="header-voice-scrambler-btn"
          >
            {isBroadcasting ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-ping shrink-0" />
                <Mic className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">LIVE</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">MIC OFF</span>
              </>
            )}
          </button>

          {/* Share invites trigger */}
          <button
            onClick={handleCopyLink}
            className="h-9 px-3 sm:px-4 rounded-xl border border-slate-800 bg-[#0f172a]/60 hover:bg-slate-900/80 text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer text-slate-200 hover:border-theme-accent-30 hover:shadow-theme-glow btn-interactive"
            title="Copy invite URL"
          >
            <Copy className="w-3.5 h-3.5 text-theme-accent" />
            <span className="hidden sm:inline font-bold tracking-wider uppercase">{copied ? 'COPIED' : 'INVITE LINK'}</span>
          </button>

          {/* Leave active session */}
          <button
            onClick={leaveActiveRoom}
            className="h-9 px-3 sm:px-4 rounded-xl border border-neon-purple/20 bg-neon-purple/5 hover:bg-neon-purple/10 text-neon-purple hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer btn-interactive"
            title="Change active room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold tracking-wider uppercase">CHANGE DECK</span>
          </button>
        </div>
      </header>

      {/* ERROR WARNING BANNER */}
      {error && (
        <div className="bg-rose-950/25 border-b border-rose-500/30 px-5 py-3 flex items-center justify-between gap-4 relative z-40 animate-pulse shadow-[inset_0_1px_15px_rgba(244,63,94,0.05)]" id="error-banner">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss error alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MOBILE TAB NAVIGATION */}
      <div className="md:hidden px-4 pt-3.5 pb-1.5 flex gap-2 border-b border-slate-800/40 bg-deep-black/40 backdrop-blur-md shrink-0 z-30" id="mobile-tabs-nav">
        <button
          onClick={() => setActiveMobileTab('chat')}
          className={`flex-1 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
            activeMobileTab === 'chat'
              ? 'bg-theme-accent-10 border-theme-accent-30 text-theme-accent shadow-theme-glow'
              : 'bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-350'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Chat Log</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('peers')}
          className={`flex-1 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
            activeMobileTab === 'peers'
              ? 'bg-theme-secondary-10 border-theme-secondary-30 text-theme-secondary shadow-theme-glow'
              : 'bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-350'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Peers ({participants.length})</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('dsp')}
          className={`flex-1 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
            activeMobileTab === 'dsp'
              ? 'bg-theme-accent-10 border-theme-accent-30 text-theme-accent shadow-theme-glow'
              : 'bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-350'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Voice DSP</span>
        </button>
      </div>

      {/* WORKSPACE GRID BODY */}
      <div 
        className="flex-1 min-h-0 flex flex-col md:flex-row w-full max-w-7xl mx-auto px-4 pb-4 gap-4 overflow-hidden relative z-10" 
        id="chat-grid-grid"
      >
        
        {/* LEFT COLUMN: ACTIVE PARTICIPANTS */}
        <aside className={`w-full md:w-64 flex-1 min-h-0 md:flex-initial glass-panel border border-slate-800/85 rounded-2xl p-4 flex flex-col gap-3.5 shrink-0 shadow-lg ${activeMobileTab === 'peers' ? 'flex animate-fadeIn' : 'hidden md:flex'}`} id="chat-aside-peers">
          <div className="flex items-center justify-between border-b border-slate-800/50 pb-2.5">
            <h2 className="text-[10px] font-mono text-theme-accent uppercase tracking-[0.18em] flex items-center gap-1.5 font-extrabold m-0">
              <span className="w-2 h-2 rounded-full bg-theme-accent animate-ping shrink-0" />
              Connected Nodes ({participants.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 md:max-h-none">
            {participants.map((user) => {
              const isMutedLocally = localMuted.has(user.sessionId);
              const isUserBroadcasting = user.hasActiveVoice;
              const isUserSpeaking = user.isSpeaking;
              const isSelf = user.sessionId === sessionId;

              return (
                <div
                  key={user.id}
                  className={`group relative p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                    isSelf 
                      ? 'border-neon-cyan/25 bg-neon-cyan/5 shadow-[0_0_15px_rgba(0,229,255,0.05)]' 
                      : 'border-slate-800/60 hover:border-neon-purple/40 bg-deep-black/40 hover:bg-[#0c1221]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <Identicon shape={user.shape} color={user.color} size={34} />
                      
                      {/* Live broadcasting indicator dots */}
                      {isUserBroadcasting && (
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                          isUserSpeaking ? 'bg-theme-accent animate-ping' : 'bg-theme-secondary'
                        }`} />
                      )}
                      {isUserBroadcasting && (
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#07090e] ${
                          isUserSpeaking ? 'bg-theme-accent glow-border-cyan' : 'bg-theme-secondary'
                        }`} />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-200 truncate pr-2 font-sans">
                        {user.alias}
                      </span>
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        {isSelf ? 'Sovereign ID' : user.sessionId.startsWith('bot-') ? 'Simulation Bot' : 'Target Node'}
                      </span>
                    </div>
                  </div>

                  {/* Micro action buttons */}
                  {!isSelf && (
                    <div className="flex items-center gap-1">
                      {/* Trigger AI cyber-trash talk roaster if this is a simulation bot */}
                      {user.sessionId.startsWith('bot-') && (
                        <button
                          onClick={() => triggerBotRoast(user.sessionId, sessionId)}
                          className="p-1.5 rounded-lg transition-all cursor-pointer bg-deep-black/60 text-amber-500 hover:text-amber-400 hover:bg-amber-500/15 border border-amber-500/15 hover:border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.05)] hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse"
                          title="Trigger AI Cyber Roast (Trash Talk)"
                        >
                          <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                        </button>
                      )}

                      {/* Local Toggle Mute */}
                      <button
                        onClick={() => toggleLocalMute(user.sessionId)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isMutedLocally 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : 'bg-deep-black/60 text-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isMutedLocally ? "Unmute Participant private" : "Privately Mute Participant"}
                      >
                        {isMutedLocally ? <VolumeX className="w-3.5 h-3.5" /> : <Volume1 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Vote Kick */}
                      <button
                        onClick={() => castVoteKickUser(user.sessionId)}
                        disabled={currentVote?.targetSessionId === user.sessionId && currentVote.hasVoted}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          currentVote?.targetSessionId === user.sessionId
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
                            : 'bg-deep-black/60 text-slate-500 hover:text-orange-400 hover:bg-slate-800'
                        }`}
                        title="Democratically initiate Vote-Kick"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* COMPACT MOBILE LIVE CHAT HIGHLIGHTS */}
          {isMobile && (
            <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-neon-cyan uppercase tracking-widest font-bold">
                  💬 Live Message Stream
                </span>
                <button 
                  type="button"
                  onClick={() => setActiveMobileTab('chat')} 
                  className="text-[9px] font-mono text-neon-purple hover:text-white uppercase font-black cursor-pointer"
                >
                  Join Chat &rarr;
                </button>
              </div>
              {messages.length === 0 ? (
                <p className="text-[10px] font-sans text-slate-500 italic px-1">No transmissions yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {messages.slice(-2).map((msg) => (
                    <div key={msg.id} className="bg-deep-black/60 border border-slate-850 p-2 rounded-xl flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-300 font-sans">{msg.sender.alias}:</span>
                        <span className="text-[8px] font-mono text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans truncate">
                        {msg.isSpoiler ? '🔒 [Spoiler]' : msg.text || '📁 Media Attachment'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Theme Selector (Sidebar) */}
          <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-2 mt-2">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">UI Accent Theme</span>
            <div className="grid grid-cols-4 gap-1">
              {['cyberpunk', 'matrix', 'obsidian', 'sunset'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => changeTheme(t)}
                  className={`py-1.5 text-[9px] font-mono font-bold uppercase rounded-lg border text-center transition-all cursor-pointer ${
                    activeTheme === t
                      ? 'bg-theme-accent-10 border-theme-accent-30 text-theme-accent'
                      : 'border-slate-800 bg-deep-black/50 text-slate-500 hover:text-slate-350'
                  }`}
                  title={`Switch to ${t} theme`}
                >
                  {t.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-3.5 flex flex-col gap-2 mt-auto">
            <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Sovereign Decoder Client</h4>
            {myIdentity && (
              <div className="flex items-center gap-2.5 bg-deep-black/50 p-3 rounded-xl border border-theme-accent-15 shadow-theme-glow">
                <Identicon shape={myIdentity.shape} color={myIdentity.color} size={32} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate font-sans">{myIdentity.alias}</span>
                  <span className="text-[8px] font-mono font-bold text-theme-accent uppercase tracking-widest mt-0.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-theme-accent animate-pulse" /> Broadcast Secure
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MIDDLE COLUMN: LIVE CHAT AND EVENTS FEED */}
        <div className={`flex-1 glass-panel border border-slate-800/85 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl bg-deep-black/10 ${activeMobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`} id="chat-center-log">
          
          {/* Active vote kick overlay visual banner */}
          {currentVote && (
            <div className="bg-orange-950/20 border-b border-orange-500/20 px-4 py-3 flex items-center justify-between gap-4 relative z-10 animate-pulse shadow-[inset_0_1px_15px_rgba(249,115,22,0.05)]" id="vote-banner">
              <div className="flex items-center gap-2 min-w-0 text-orange-400 text-xs font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0 text-orange-400" />
                <span className="truncate">
                  Target-Kick Sequence: <strong className="text-white">{currentVote.targetAlias}</strong> ({currentVote.votesCount}/{currentVote.requiredVotes} votes cast)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => castVoteKickUser(currentVote.targetSessionId)}
                  disabled={currentVote.hasVoted}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-deep-black font-mono text-[10px] font-extrabold uppercase transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.3)] hover:shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                >
                  {currentVote.hasVoted ? 'Ballot Cast' : 'Vote Kick'}
                </button>
              </div>
            </div>
          )}

          {/* CHAT LOG FEEDS */}
          <div className="flex-1 overflow-y-auto px-5 py-4 scroll-smooth" id="chat-messages-container">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-3.5 bg-deep-black/40 rounded-2xl border border-slate-800/50 max-w-md mx-auto my-auto shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]" id="empty-state-card">
                <div className="p-3.5 bg-theme-accent-10 rounded-2xl border border-theme-accent-15 shadow-theme-glow mb-1">
                  <Hash className="w-8 h-8 stroke-[1.5] text-theme-accent animate-pulse" />
                </div>
                <span className="font-display text-sm font-semibold text-theme-accent uppercase tracking-widest">Isolated Channel Airspace</span>
                <p className="text-xs max-w-xs font-sans text-slate-500 leading-relaxed font-semibold">
                  Zero packets recorded. Say something below! Use Spoilers or Toggle Burn-mode counters to safeguard your words recursively.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  currentUserId={sessionId}
                  isMuted={localMuted.has(msg.sender.sessionId)}
                  onBurnExpired={burnMessageLocally}
                />
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* MESSAGE FORM INPUT TRAY */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-deep-black/60 flex flex-col gap-2.5" id="chat-form">
            
            {/* Modular transient controls indicators tray */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
              <div className="flex items-center gap-3">
                {/* Burn Mode toggle */}
                <button
                  type="button"
                  onClick={() => setIsBurnMode(!isBurnMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 cursor-pointer ${
                    isBurnMode 
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] font-bold' 
                      : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 bg-deep-black/50'
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${isBurnMode ? 'text-rose-450 animate-pulse' : ''}`} />
                  <span>Burn mode</span>
                </button>

                {isBurnMode && (
                  <select
                    value={burnTimer}
                    onChange={(e) => setBurnTimer(Number(e.target.value))}
                    className="bg-deep-black border border-slate-800 text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neon-cyan transition-colors"
                    title="Burn countdown duration"
                  >
                    <option value={5}>5 SECONDS</option>
                    <option value={10}>10 SECONDS</option>
                    <option value={30}>30 SECONDS</option>
                  </select>
                )}

                {/* Spoiler mode toggle */}
                <button
                  type="button"
                  onClick={() => setIsSpoilerMode(!isSpoilerMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 cursor-pointer ${
                    isSpoilerMode 
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)] font-bold' 
                      : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 bg-deep-black/50'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Spoiler</span>
                </button>
              </div>

              {/* Character limit/Notice badge */}
              <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest select-none">
                {isBurnMode ? '⚡ ephemeral packets active' : '🔐 volatile static stream'}
              </span>
            </div>

            {/* EMOJI PICKER DRAW/TRAY */}
            {showEmojiPicker && (
              <div className="mx-1 mb-2.5 p-3.5 bg-[#0a0f1d] border border-slate-800/80 rounded-2xl flex flex-col gap-2.5 shadow-2xl animate-fade-in z-30" id="emoji-picker-container">
                {/* Category tabs */}
                <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                  <div className="flex gap-1 overflow-x-auto scrollbar-none">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveEmojiCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap border font-bold ${
                          activeEmojiCategory === cat.id
                            ? 'bg-neon-purple/15 text-neon-purple border-neon-purple/25 shadow-[0_0_8px_rgba(123,97,255,0.1)]'
                            : 'text-slate-500 hover:text-slate-350 border-transparent hover:bg-slate-900/30'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-[9px] uppercase tracking-widest font-mono text-theme-accent hover:text-white px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 transition-all cursor-pointer font-bold"
                  >
                    Close
                  </button>
                </div>

                {/* Emoji Grid */}
                <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {EMOJI_CATEGORIES.find((cat) => cat.id === activeEmojiCategory)?.emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="aspect-square flex items-center justify-center text-xl hover:bg-[#0f172a] active:scale-90 rounded-lg transition-all duration-150 cursor-pointer p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ATTACHMENT PREVIEW DRAWER */}
            {attachedMedia && (
              <div className="mx-1 mb-2 p-3 bg-deep-black/95 border border-slate-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                  {attachedMedia.type === 'image' ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-[#07090e] shrink-0">
                      <img src={attachedMedia.url} alt="Attachment preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-theme-accent-10 border border-theme-accent-15 text-theme-accent flex items-center justify-center text-sm shrink-0">
                      📁
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-slate-205 font-bold font-sans truncate max-w-[180px] sm:max-w-xs">{attachedMedia.name}</p>
                    <p className="text-[9px] font-mono text-theme-accent font-semibold uppercase tracking-widest capitalize">{attachedMedia.type} module readied</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedMedia(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-700"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input field text box with media buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className={`p-3 bg-[#0d1324] hover:bg-[#131b33] text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer shrink-0 btn-interactive ${
                  isUploadingMedia ? 'opacity-50 pointer-events-none text-theme-accent' : ''
                }`}
                title="Attach microchip module, image or log file"
                id="attach-file-btn"
              >
                <Paperclip className={`w-4 h-4 ${isUploadingMedia ? 'animate-spin text-theme-accent' : ''}`} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,text/*,application/json"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-3 border rounded-xl transition-all cursor-pointer shrink-0 btn-interactive ${
                  showEmojiPicker 
                    ? 'bg-theme-secondary-10 border-theme-secondary-30 text-theme-secondary shadow-theme-glow font-bold' 
                    : 'bg-[#0d1324] hover:bg-[#131b33] border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle custom emoji palette"
                id="emoji-toggle-btn"
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  isBurnMode 
                    ? `Whisper something (burns completely after reading in ${burnTimer}s)...` 
                    : isSpoilerMode 
                      ? "Wrap text in blurred spoiler filters..." 
                      : "Speak your mind privately over secure relay..."
                }
                className="flex-1 bg-deep-black border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent-20 transition-all font-sans"
                id="text-message-input"
              />
              <button
                type="submit"
                disabled={!textInput.trim() && !attachedMedia}
                className={`p-3.5 rounded-xl border transition-all duration-350 font-bold shrink-0 btn-interactive flex items-center justify-center ${
                  (!textInput.trim() && !attachedMedia)
                    ? 'bg-[#0d1324] border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-theme-accent border-transparent text-deep-black shadow-theme-glow hover:brightness-110 cursor-pointer animate-glow'
                }`}
                title="Transmit secure message pack"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: HIGH FIDELITY AUDIO DSP SUITE */}
        <aside className={`w-full md:w-80 flex-1 min-h-0 md:flex-initial glass-panel border border-slate-800/85 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-lg ${activeMobileTab === 'dsp' ? 'flex animate-fadeIn' : 'hidden md:flex'}`} id="chat-aside-dsp">
          <div className="border-b border-slate-800/50 pb-2.5">
            <h2 className="text-[10px] font-mono text-theme-accent uppercase tracking-[0.18em] flex items-center gap-1.5 font-extrabold m-0">
              <Radio className="w-4 h-4 text-theme-accent animate-pulse shrink-0" /> Live Voice Scrambler (DSP)
            </h2>
          </div>

          {/* MIC CONTROLLER AND GLOW UNIT */}
          <div className="flex flex-col gap-3.5 bg-deep-black/60 border border-slate-855 p-4 rounded-2xl items-center text-center relative overflow-hidden shrink-0" id="dsp-mic-box">
            {isBroadcasting && (
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl opacity-20" />
            )}
            
            <div className="relative flex items-center justify-center">
              {/* Dynamic waveform visualization scale rings based on streaming voice */}
              {isBroadcasting && (
                <div className="absolute w-20 h-20 bg-theme-accent-10 rounded-full border border-theme-accent-30 animate-ping" />
              )}
              {isBroadcasting && (
                <div className="absolute w-16 h-16 bg-theme-accent-10 rounded-full border border-theme-accent-30 animate-pulse" />
              )}
              
              <button
                onClick={isBroadcasting ? stopVoiceCapture : startVoiceCapture}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer relative z-10 p-1 border shadow-lg btn-interactive ${
                  isBroadcasting 
                    ? 'bg-theme-accent text-deep-black shadow-theme-glow border-transparent hover:scale-105' 
                    : 'bg-theme-secondary-10 text-theme-secondary hover:bg-theme-secondary-10 hover:text-white border-theme-secondary-30'
                }`}
                title="Toggle vocal scrambler"
              >
                {isBroadcasting ? <MicOff className="w-5.5 h-5.5" /> : <Mic className="w-5.5 h-5.5" />}
              </button>
            </div>

            <div className="flex flex-col gap-1 z-10 w-full">
              <span className={`text-[11px] font-mono font-bold tracking-wide uppercase ${isBroadcasting ? 'text-theme-accent' : 'text-slate-500'}`}>
                {isBroadcasting ? '📡 scrambler active' : '🎙️ mic loop closed'}
              </span>
              <p className="text-[10px] text-slate-500 font-sans font-medium">
                {isBroadcasting 
                  ? 'Your voice spectrum is scrambled in real-time' 
                  : 'Transmit pitch modulated peer feed'
                }
              </p>
            </div>

            {/* Local Voice Loopback Monitor */}
            {isBroadcasting && (
              <div className="flex items-center justify-between border-t border-slate-800/60 w-full pt-3 mt-1">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Monitor Own Loop</span>
                <button
                  onClick={() => toggleVoiceMonitor(!isMonitoringOwnVoice)}
                  className={`px-3 py-1 text-[9px] font-mono font-bold rounded-lg border transition-all duration-300 cursor-pointer ${
                    isMonitoringOwnVoice 
                      ? 'bg-theme-accent-10 border-theme-accent-30 text-theme-accent' 
                      : 'border-slate-800 bg-deep-black text-slate-550'
                  }`}
                >
                  {isMonitoringOwnVoice ? 'Monitor active' : 'Monitor mute'}
                </button>
              </div>
            )}
          </div>

          {/* PITCH AND FORMANT SHIFT SLIDERS (FR-3.2) */}
          <div className="flex flex-col gap-3.5 bg-deep-black/60 border border-slate-850 p-4 rounded-xl shrink-0">
            <h3 className="text-[10px] font-mono text-theme-secondary uppercase tracking-[0.14em] font-bold">
              Frequency Masking
            </h3>

            {/* Natural Voice Bypass Toggle Option */}
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5 mb-0.5">
              <span className="text-[10px] font-mono text-slate-300 font-semibold uppercase tracking-wider">Natural Voice Bypass</span>
              <button
                type="button"
                onClick={() => setAudioSettings(prev => ({ ...prev, naturalVoice: !prev.naturalVoice }))}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold rounded-lg border transition-all duration-300 cursor-pointer uppercase ${
                  audioSettings.naturalVoice 
                    ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan shadow-[0_0_8px_rgba(0,229,255,0.15)] animate-pulse' 
                    : 'border-slate-800 bg-deep-black text-slate-500 hover:text-slate-400'
                }`}
                title="When active, bypasses vocal scrambling features to broadcast clean unfiltered microphone curves"
              >
                {audioSettings.naturalVoice ? '🚫 ON' : '🔐 OFF'}
              </button>
            </div>

            {/* Pitch Modulation Slider */}
            <div className={`space-y-1.5 transition-all duration-300 ${audioSettings.naturalVoice ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 font-semibold uppercase">PITCH SCRAPING</span>
                <span className="text-theme-accent font-bold">{audioSettings.pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={audioSettings.pitch}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, pitch: Number(e.target.value) }))}
                className="w-full accent-theme-accent cursor-pointer rounded-lg bg-deep-black border border-slate-800 h-1.5 outline-none appearance-none"
              />
              <div className="text-[10px] font-mono text-slate-305 bg-deep-black border border-slate-800 p-2 rounded-xl text-center font-bold">
                {getPitchDescriptor(audioSettings.pitch)}
              </div>
            </div>

            {/* Formant shifts descriptor Slider */}
            <div className={`space-y-1.5 pt-1 transition-all duration-300 ${audioSettings.naturalVoice ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 font-semibold uppercase">RESONANCE FORMANT</span>
                <span className="text-theme-secondary font-bold">{audioSettings.formant.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={audioSettings.formant}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, formant: Number(e.target.value) }))}
                className="w-full accent-theme-secondary cursor-pointer rounded-lg bg-deep-black border border-slate-800 h-1.5 outline-none appearance-none"
              />
              <div className="text-[10px] font-mono text-slate-305 bg-deep-black border border-slate-800 p-2 rounded-xl text-center font-bold">
                {getFormantDescriptor(audioSettings.formant)}
              </div>
            </div>
          </div>

          {/* ENVIRONMENTAL MASKING SYNTH OVERLAY (FR-3.3) */}
          <div className="flex flex-col gap-2.5 bg-deep-black/60 border border-slate-855 p-4 rounded-xl shrink-0">
            <h3 className="text-[10px] font-mono text-theme-accent uppercase tracking-[0.14em] font-bold">
              Ambience Synthetic overlay
            </h3>
            
            <div className="grid grid-cols-2 gap-1.5">
              {(['none', 'rain', 'traffic', 'cafe'] as const).map((mode) => {
                const isSelected = audioSettings.masking === mode;
                const label = mode === 'none' ? '🚫 Clean Void' : mode === 'rain' ? '🌧️ Rainfall' : mode === 'traffic' ? '🚗 Highway' : '☕ Cafe Sound';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setAudioSettings(prev => ({ ...prev, masking: mode }));
                    }}
                    className={`px-2 py-2.5 text-[9px] font-mono font-bold uppercase rounded-xl border text-center transition-all duration-350 cursor-pointer ${
                      isSelected 
                        ? 'bg-theme-accent-10 border-theme-accent-30 text-theme-accent shadow-theme-glow' 
                        : 'bg-deep-black border-slate-800 text-slate-550 hover:text-slate-305 hover:bg-[#07090e]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-500 font-mono text-center leading-relaxed">
              Layers synthetic white noise curves or waves directly over your live microphone channel.
            </p>
          </div>

          {/* LOCALIZED VOICE PROXY (TTS PROXY FR-3.4) */}
          <div className="flex flex-col gap-2 bg-deep-black/60 border border-slate-850 p-4 rounded-xl shrink-0">
            <h3 className="text-[10px] font-mono text-theme-secondary uppercase tracking-[0.14em] font-bold flex items-center justify-between">
              <span>Voice Proxy</span>
              <span className="text-[8px] bg-theme-secondary-10 text-theme-secondary border border-theme-secondary-20 tracking-widest font-mono px-1.5 py-0.5 rounded font-bold uppercase">TTS PROCESSOR</span>
            </h3>

            <p className="text-[9px] text-slate-500 font-sans leading-relaxed font-semibold">
              Type text and click play. Synthesizes a computer voice directly in other participants' headphones.
            </p>

            <form onSubmit={handleSendTTSProxy} className="flex gap-1.5">
              <input
                type="text"
                value={ttsInput}
                onChange={(e) => setTtsInput(e.target.value)}
                placeholder="Convert bytes into vocal voice stream"
                className="flex-1 text-[11px] bg-deep-black border border-slate-855 rounded-lg px-2.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-theme-secondary-30 transition-all font-sans"
                id="voice-proxy-tts-input"
              />
              <button
                type="submit"
                disabled={!ttsInput.trim()}
                className="px-3 py-2 bg-theme-accent-10 border border-theme-accent-30 text-theme-accent disabled:opacity-30 disabled:border-slate-800 hover:brightness-110 disabled:hover:scale-100 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer shadow-theme-glow btn-interactive"
              >
                Vocalize
              </button>
            </form>
          </div>

          {/* COMPACT MOBILE LIVE CHAT HIGHLIGHTS */}
          {isMobile && (
            <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-theme-accent uppercase tracking-widest font-bold">
                  💬 Live Message Stream
                </span>
                <button 
                  type="button"
                  onClick={() => setActiveMobileTab('chat')} 
                  className="text-[9px] font-mono text-theme-secondary hover:text-white uppercase font-black cursor-pointer font-bold"
                >
                  Join Chat &rarr;
                </button>
              </div>
              {messages.length === 0 ? (
                <p className="text-[10px] font-sans text-slate-500 italic">No transmissions yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {messages.slice(-2).map((msg) => (
                    <div key={msg.id} className="bg-deep-black/60 border border-slate-850 p-2 rounded-xl flex flex-col gap-0.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-300 font-sans">{msg.sender.alias}:</span>
                        <span className="text-[8px] font-mono text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans truncate">
                        {msg.isSpoiler ? '🔒 [Spoiler]' : msg.text || '📁 Media Attachment'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SPOOKY TESTING SANDBOX BOT - FOR TESTING OF MULTI-PLAYERS & VOTE-KICK (FR-5.2) */}
          <div className="border-t border-slate-800/50 pt-4 flex flex-col gap-2 mt-auto shrink-0" id="sandbox-tester-controls">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.18em] font-bold">Simulator Core</span>
              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest font-mono animate-pulse">SANDBOX PORT</span>
            </div>
            
            <button
              onClick={requestSimulationBot}
              className="w-full py-3 bg-deep-black text-slate-350 hover:text-theme-accent border border-slate-800 border-dashed hover:border-theme-accent-30 rounded-xl text-xs font-mono font-bold uppercase transition-all duration-350 btn-interactive cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-theme-accent" />
              <span>Simulate Peer Bot</span>
            </button>
            
            <p className="text-[9px] text-slate-500 font-sans font-medium text-center leading-normal">
              Spawns simulated clients in memory to test ephemeral reading countdowns, spoiler tags, and democratic vote kick routing.
            </p>
          </div>
        </aside>

      </div>
    </main>
  );
}

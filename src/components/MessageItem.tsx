import React, { useEffect, useState, useRef } from 'react';
import { Message } from '../types';
import { Identicon } from './Identicon';
import { Eye, EyeOff, Flame, Volume2 } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onBurnExpired: (id: string) => void;
  isMuted: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, currentUserId, onBurnExpired, isMuted }) => {
  const { id, sender, text, timestamp, isBurn, burnTimer, isSpoiler } = message;
  const isMe = sender.sessionId === currentUserId;
  
  const [timeLeft, setTimeLeft] = useState(burnTimer);
  const [hasStartedBurning, setHasStartedBurning] = useState(false);
  const timerRef = useRef<any>(null);

  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  useEffect(() => {
    if (isBurn) {
      setHasStartedBurning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onBurnExpired(id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBurn, id]);

  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div 
      className={`group flex items-start gap-3 my-3 p-3 rounded-2xl transition-all duration-200 ${
        isMe ? 'bg-slate-800/40 border border-slate-700/30' : 'bg-slate-800/80 border border-slate-700/50'
      } ${isMuted ? 'opacity-30 pointer-events-none' : ''}`}
      id={`chat-msg-${id}`}
    >
      <Identicon shape={sender.shape} color={sender.color} size={38} className="shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="font-display font-medium text-sm text-slate-200 truncate flex items-center gap-1.5">
            {sender.alias}
            {isMe && <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">Me</span>}
            {(message as any).isTTS && (
              <span className="text-[10px] font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="TTS Proxy Vocalized stream">
                <Volume2 className="w-3 h-3" /> Voice Proxy
              </span>
            )}
          </span>
          <span className="font-mono text-[10px] text-slate-500 shrink-0">{formattedTime}</span>
        </div>

        <div className="relative text-[14px] leading-relaxed text-slate-300 break-words">
          {text ? (
            isSpoiler ? (
              <div className="relative inline-block select-none max-w-full">
                <span 
                  className={`transition-all duration-200 block px-2.5 py-1.5 rounded-lg border cursor-pointer select-none font-sans text-[14px] ${
                    isSpoilerRevealed 
                      ? 'bg-slate-900/60 border-slate-700 blur-none' 
                      : 'bg-slate-950 border-slate-950 filter blur-md select-none'
                  }`}
                  onPointerDown={() => setIsSpoilerRevealed(true)}
                  onPointerUp={() => setIsSpoilerRevealed(false)}
                  onPointerLeave={() => setIsSpoilerRevealed(false)}
                  onTouchStart={(e) => { e.preventDefault(); setIsSpoilerRevealed(true); }}
                  onTouchEnd={() => setIsSpoilerRevealed(false)}
                  title="Tap and Hold to Reveal"
                >
                  {text}
                </span>
                
                {!isSpoilerRevealed && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-rose-400/80 font-display font-medium gap-1 uppercase tracking-wider">
                    <EyeOff className="w-3.5 h-3.5" /> Spoiler (Hold)
                  </div>
                )}
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{text}</div>
            )
          ) : null}

          {message.mediaUrl && (
            <div className="mt-2.5 max-w-full sm:max-w-sm rounded-xl overflow-hidden border border-slate-800 bg-slate-950/40 p-1.5 select-none">
              {message.mediaType === 'image' ? (
                isSpoiler ? (
                  <div className="relative inline-block select-none w-full aspect-video md:w-80 overflow-hidden rounded-lg">
                    <img 
                      src={message.mediaUrl} 
                      alt={message.mediaName || 'Uploaded image'} 
                      className={`w-full h-full object-cover rounded-lg select-none pointer-events-none transition-all duration-200 ${
                        isSpoilerRevealed ? 'blur-none' : 'blur-xl'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    {!isSpoilerRevealed && (
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 text-rose-400 font-display font-medium text-xs gap-1.5 uppercase tracking-wider cursor-pointer"
                        onPointerDown={() => setIsSpoilerRevealed(true)}
                        onPointerUp={() => setIsSpoilerRevealed(false)}
                        onPointerLeave={() => setIsSpoilerRevealed(false)}
                        onTouchStart={(e) => { e.preventDefault(); setIsSpoilerRevealed(true); }}
                        onTouchEnd={() => setIsSpoilerRevealed(false)}
                      >
                        <EyeOff className="w-4 h-4 text-rose-500" />
                        <span>Spoiler Image (Hold)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <img 
                    src={message.mediaUrl} 
                    alt={message.mediaName || 'Uploaded image'} 
                    className="max-h-60 rounded-lg max-w-full object-contain cursor-zoom-in"
                    referrerPolicy="no-referrer"
                    onClick={() => {
                      const win = window.open();
                      if (win) {
                        win.document.write(`<img src="${message.mediaUrl}" style="max-width:100\%; max-height:100\%; display:block; margin:auto; position:absolute; top:0; bottom:0; left:0; right:0;" />`);
                      }
                    }}
                  />
                )
              ) : (
                <div className="p-2 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-lg">
                      📁
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-300 font-medium truncate max-w-[150px] sm:max-w-[200px]">{message.mediaName}</p>
                      <p className="text-[10px] text-slate-500 font-normal">File Attachment</p>
                    </div>
                  </div>
                  <a 
                    href={message.mediaUrl} 
                    download={message.mediaName || 'attachment'} 
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 font-bold font-sans transition-all shrink-0 cursor-pointer text-center text-[11px]"
                  >
                    Save
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {isBurn && hasStartedBurning && (
          <div className="mt-3.5 bg-slate-900/80 rounded-xl px-2.5 py-1.5 border border-red-950 flex flex-col gap-1.5 max-w-sm">
            <div className="flex items-center justify-between text-[11px] font-mono font-medium text-rose-400">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500 animate-pulse" /> Ephemeral Burn
              </span>
              <span>{timeLeft}s remaining</span>
            </div>
            
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-rose-500 to-orange-500 rounded-full animate-burn-timer" 
                style={{ 
                  animationDuration: `${burnTimer}s`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
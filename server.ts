import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Fallback canned trash talk in case of API Key absence or API call errors
const FALLBACK_ROASTS = [
  "My encryption key has more entropy than your entire brain's analog neural network.",
  "Your voice modulation sounds less like DSP filtering and more like a dial-up modem struggling to connect.",
  "Are you coding in HTML or just copy-pasting from a 1999 stack exchange thread?",
  "I've seen quantum decoherence more stable than your connection stability, script kiddie.",
  "Did you forget to plug in your audio interface, or is your voice spectrum naturally a sine wave of pure white noise?",
  "Nice spoiler tag. Too bad the message inside is about as exciting as a firmware update.",
  "Your packets are dropping faster than your social standing in this encrypted channel.",
  "I've seen dial-up connections with better bandwidth than your verbal processor."
];

let aiClient: any = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function generateTrashTalk(contextMessages: Array<{ senderAlias: string; text: string }>, targetAlias?: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
  }

  try {
    const chatContext = contextMessages.map(m => `${m.senderAlias}: ${m.text}`).join('\n');
    let prompt = "";
    if (targetAlias) {
      prompt = `Generate a playful, witty cyber-themed hacker trash-talk roast directly roasting user "${targetAlias}". Keep it lighthearted but sassy, strictly under 18 words. No vulgarity, no offensive slurs. Use mild geeky tech slang (e.g. modem, mainframe, noob, packet, encryption, cache, buffer).`;
    } else {
      prompt = `Generate a playful, witty cyber-themed hacker trash-talk roast responding to this recent chat context:\n${chatContext}\nKeep it lighthearted but sassy, strictly under 18 words. No vulgarity, no offensive slurs. Use mild geeky tech slang.`;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a highly witty, sarcastic but playful cyberpunk hacking bot named in an encrypted anonymous voice/text room. Generate a short, snappy, playful cyber-roast or trash-talk about hackers, encryption, modulations, or their text. Never be offensive, keep it light, clever, and cyberpunk, under 18 words. Avoid quote marks in the output. Keep it classy but sassy.",
        temperature: 1.0,
      }
    });

    return response.text?.trim()?.replace(/^["']|["']$/g, '') || FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
  } catch (err) {
    console.error("[Gemini Roast Error]", err);
    return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
  }
}

// Lists for random alias generation (e.g., 'Neon Tiger')
const SYSTEM_ADJECTIVES = [
  'Neon', 'Electric', 'Cosmic', 'Silent', 'Mystic', 'Glowing', 'Stealth', 
  'Shadow', 'Quantum', 'Retro', 'Solar', 'Lunar', 'Sonic', 'Cyber', 
  'Liquid', 'Frozen', 'Fiery', 'Dynamic', 'Spectral', 'Vortex', 'Astral',
  'Zen', 'Atomic', 'Echo', 'Prismic', 'Turbo', 'Obsidian', 'Hyper'
];

const SYSTEM_NOUNS = [
  'Tiger', 'Panda', 'Falcon', 'Fox', 'Owl', 'Panther', 'Dragon', 'Phoenix', 
  'Wolf', 'Lynx', 'Coyote', 'Badger', 'Viper', 'Cobra', 'Eagle', 'Shark', 
  'Orca', 'Mammoth', 'Cheetah', 'Raven', 'Grizzly', 'Condor', 'Jaguar',
  'Stinger', 'Viper', 'Rhino', 'Leopard', 'Raptor'
];

// Geometric shapes for user avatars
const IDENTICON_SHAPES = [
  'circle', 'triangle', 'square', 'hexagon', 'octagon', 'pentagon', 'diamond', 'star'
];

// Aesthetic vibrant colors for avatars
const IDENTICON_COLORS = [
  '#FF5E5E', '#FF9F43', '#FECA57', '#1DD1A1', '#FF6B6B', '#10AC84', 
  '#48DBFB', '#00D2D3', '#54A0FF', '#2E86DE', '#9C88FF', '#8C7AE6', 
  '#FF4757', '#FF6B81', '#747D8C', '#2F3542', '#20BF6B', '#A55EEA'
];

interface Participant {
  id: string;        // Unique socket connection ID
  sessionId: string; // Browser-persistent or session-persistent unique ID
  alias: string;
  color: string;
  shape: string;
  ip: string;
  ws: WebSocket;
  isSpeaking: boolean;
  hasActiveVoice: boolean;
}

interface Room {
  hashtag: string;
  participants: Map<string, Participant>;
  lastActivity: number;
  // Map of targetSessionId -> Set of voting sessionIds
  kickVotes: Map<string, Set<string>>;
  recentMessages?: Array<{ senderAlias: string; text: string }>;
}

const rooms = new Map<string, Room>();

// Track vote-kick ban lists (24-hour block)
// sessionId -> { hashtag, expires }
const blockedSessions = new Map<string, { hashtag: string; expires: number }>();

function generateUniqueAlias(existingAliases: Set<string>): string {
  let attempt = 0;
  while (attempt < 200) {
    const adj = SYSTEM_ADJECTIVES[Math.floor(Math.random() * SYSTEM_ADJECTIVES.length)];
    const noun = SYSTEM_NOUNS[Math.floor(Math.random() * SYSTEM_NOUNS.length)];
    const candidate = `${adj} ${noun}`;
    if (!existingAliases.has(candidate)) {
      return candidate;
    }
    attempt++;
  }
  return `User ${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(cors());
  app.use(express.json());

  // API Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      time: new Date().toISOString()
    });
  });

  // Check ban status before allowing user to join
  app.get('/api/check-block', (req, res) => {
    const { sessionId, hashtag } = req.query;
    if (typeof sessionId !== 'string' || typeof hashtag !== 'string') {
      res.status(400).json({ error: 'Missing sessionId or hashtag' });
      return;
    }

    const block = blockedSessions.get(sessionId);
    if (block && block.hashtag.toLowerCase() === hashtag.toLowerCase()) {
      if (Date.now() < block.expires) {
        const remainingHours = Math.ceil((block.expires - Date.now()) / (1000 * 60 * 60));
        res.json({ blocked: true, remainingHours });
        return;
      } else {
        blockedSessions.delete(sessionId);
      }
    }
    res.json({ blocked: false });
  });

  // Handle Upgrade to WebSockets manually to bind to port 3000
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, req) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();
    const connectionId = Math.random().toString(36).substring(2, 15);
    let currentHashtag = '';
    let userSessionId = '';

    console.log(`[WS] Connection established from IP ${ip} (id: ${connectionId})`);

    ws.on('message', async (messageData) => {
      try {
        const rawString = messageData.toString();
        // Check if message is JSON
        if (!rawString.startsWith('{')) {
          // If it's a raw voice data packet fallback or specific packet
          return;
        }

        const data = JSON.parse(rawString);

        if (data.type === 'join') {
          const { hashtag, sessionId } = data;
          if (!hashtag || !sessionId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Missing join parameters' }));
            return;
          }

          const cleanHashtag = hashtag.trim().toLowerCase().startsWith('#') 
            ? hashtag.trim().toLowerCase() 
            : `#${hashtag.trim().toLowerCase()}`;
          
          userSessionId = sessionId;
          currentHashtag = cleanHashtag;

          // Double check 24-hour block list
          const block = blockedSessions.get(sessionId);
          if (block && block.hashtag === cleanHashtag) {
            if (Date.now() < block.expires) {
              ws.send(JSON.stringify({ 
                type: 'blocked', 
                message: 'You have been vote-kicked by this room and are temporarily blocked from rejoining.' 
              }));
              ws.close();
              return;
            } else {
              blockedSessions.delete(sessionId);
            }
          }

          // Get or create room in memory
          let room = rooms.get(cleanHashtag);
          if (!room) {
            room = {
              hashtag: cleanHashtag,
              participants: new Map(),
              lastActivity: Date.now(),
              kickVotes: new Map()
            };
            rooms.set(cleanHashtag, room);
            console.log(`[Room Created] ${cleanHashtag}`);
          }

          room.lastActivity = Date.now();

          // Collect current aliases in room to avoid collisions
          const existingAliases = new Set<string>();
          for (const p of room.participants.values()) {
            existingAliases.add(p.alias);
          }

          // Generate unique identity with random avatar parameters
          const alias = generateUniqueAlias(existingAliases);
          const color = IDENTICON_COLORS[Math.floor(Math.random() * IDENTICON_COLORS.length)];
          const shape = IDENTICON_SHAPES[Math.floor(Math.random() * IDENTICON_SHAPES.length)];

          const participant: Participant = {
            id: connectionId,
            sessionId: userSessionId,
            alias,
            color,
            shape,
            ip,
            ws,
            isSpeaking: false,
            hasActiveVoice: false
          };

          room.participants.set(connectionId, participant);

          // Tell the user their assigned anonymous credentials
          ws.send(JSON.stringify({
            type: 'assigned_identity',
            identity: {
              sessionId: userSessionId,
              alias,
              color,
              shape
            }
          }));

          // Send current participant list to the new user
          const participantList = Array.from(room.participants.values()).map(p => ({
            id: p.id,
            sessionId: p.sessionId,
            alias: p.alias,
            color: p.color,
            shape: p.shape,
            isSpeaking: p.isSpeaking,
            hasActiveVoice: p.hasActiveVoice
          }));

          ws.send(JSON.stringify({
            type: 'init_state',
            participants: participantList,
            hashtag: cleanHashtag
          }));

          // Notify other participants
          broadcastToRoom(cleanHashtag, {
            type: 'user_joined',
            participant: {
              id: p_meta(participant).id,
              sessionId: p_meta(participant).sessionId,
              alias: p_meta(participant).alias,
              color: p_meta(participant).color,
              shape: p_meta(participant).shape,
              isSpeaking: false,
              hasActiveVoice: false
            }
          });

          console.log(`[WS Join] ${alias} joined ${cleanHashtag}. Total: ${room.participants.size}`);
          return;
        }

        // Must be in a room for subsequent events
        if (!currentHashtag) return;
        const room = rooms.get(currentHashtag);
        if (!room) return;

        // Reset inactivity timer
        room.lastActivity = Date.now();
        const me = room.participants.get(connectionId);
        if (!me) return;

        if (data.type === 'message') {
          // Handle messaging with self-destruct or spoiler options
          const { text, isBurn, burnTimer, isSpoiler, mediaUrl, mediaName, mediaType } = data;
          
          if (!room.recentMessages) {
            room.recentMessages = [];
          }
          if (text) {
            room.recentMessages.push({ senderAlias: me.alias, text });
            if (room.recentMessages.length > 10) {
              room.recentMessages.shift();
            }
          }

          broadcastToRoom(currentHashtag, {
            type: 'message',
            message: {
              id: Math.random().toString(36).substring(2, 10),
              sender: {
                id: me.id,
                sessionId: me.sessionId,
                alias: me.alias,
                color: me.color,
                shape: me.shape
              },
              text: text || '',
              timestamp: Date.now(),
              isBurn: !!isBurn,
              burnTimer: burnTimer || 10,
              isSpoiler: !!isSpoiler,
              mediaUrl,
              mediaName,
              mediaType
            }
          });

          // Dynamic AI Trash-Talk response logic
          const botsInRoom = Array.from(room.participants.values()).filter(p => p.sessionId.startsWith('bot-'));
          if (botsInRoom.length > 0 && text) {
            const mentionedBot = botsInRoom.find(b => text.toLowerCase().includes(b.alias.toLowerCase()) || text.toLowerCase().includes('@bot'));
            const isMentioned = !!mentionedBot;
            // 25% chance to organically chime in on conversation, or 100% when explicitly @mentioned
            const shouldReply = isMentioned || (Math.random() < 0.25);

            if (shouldReply) {
              const activeBot = mentionedBot || botsInRoom[Math.floor(Math.random() * botsInRoom.length)];
              
              // Simulate dynamic network typing or processing latency
              setTimeout(async () => {
                const refreshedRoom = rooms.get(currentHashtag);
                if (!refreshedRoom || !refreshedRoom.participants.has(activeBot.id)) return;

                const roastText = await generateTrashTalk(refreshedRoom.recentMessages || [], isMentioned ? me.alias : undefined);

                if (!refreshedRoom.recentMessages) {
                  refreshedRoom.recentMessages = [];
                }
                refreshedRoom.recentMessages.push({ senderAlias: activeBot.alias, text: roastText });
                if (refreshedRoom.recentMessages.length > 10) {
                  refreshedRoom.recentMessages.shift();
                }

                broadcastToRoom(currentHashtag, {
                  type: 'message',
                  message: {
                    id: Math.random().toString(36).substring(2, 10),
                    sender: {
                      id: activeBot.id,
                      sessionId: activeBot.sessionId,
                      alias: activeBot.alias,
                      color: activeBot.color,
                      shape: activeBot.shape
                    },
                    text: roastText,
                    timestamp: Date.now(),
                    isBurn: false,
                    isSpoiler: false
                  }
                });
              }, 1200 + Math.random() * 1500);
            }
          }
          return;
        }

        if (data.type === 'voice_proxy_tts') {
          // Handle Text-to-Speech proxy payload
          const { text } = data;
          broadcastToRoom(currentHashtag, {
            type: 'voice_proxy_tts',
            message: {
              id: Math.random().toString(36).substring(2, 10),
              sender: {
                id: me.id,
                sessionId: me.sessionId,
                alias: me.alias,
                color: me.color,
                shape: me.shape
              },
              text: text || '',
              timestamp: Date.now()
            }
          });
          return;
        }

        if (data.type === 'voice_state') {
          const { hasActiveVoice, isSpeaking } = data;
          me.hasActiveVoice = !!hasActiveVoice;
          me.isSpeaking = !!isSpeaking;

          broadcastToRoom(currentHashtag, {
            type: 'user_voice_state',
            id: me.id,
            sessionId: me.sessionId,
            hasActiveVoice: me.hasActiveVoice,
            isSpeaking: me.isSpeaking
          });
          return;
        }

        if (data.type === 'voice_chunk') {
          // Low latency live voice broadcasting. Broadcast to all OTHER users
          const { audioData, settings } = data; 
          broadcastToRoom(currentHashtag, {
            type: 'voice_chunk',
            senderId: me.id,
            senderSessionId: me.sessionId,
            audioData,
            settings
          }, connectionId);
          return;
        }

        if (data.type === 'vote_kick') {
          // Handle vote-kick sequence
          const { targetSessionId } = data;
          if (!targetSessionId) return;

          // Find full target details in current room
          let targetParticipant: Participant | null = null;
          for (const p of room.participants.values()) {
            if (p.sessionId === targetSessionId) {
              targetParticipant = p;
              break;
            }
          }

          if (!targetParticipant) {
            ws.send(JSON.stringify({ type: 'error', message: 'Target participant not found in this room.' }));
            return;
          }

          // Initial setup of votes for this target session ID
          if (!room.kickVotes.has(targetSessionId)) {
            room.kickVotes.set(targetSessionId, new Set<string>());
          }

          const voterSet = room.kickVotes.get(targetSessionId)!;
          voterSet.add(me.sessionId);

          const activeRoomSize = room.participants.size;
          const votesCount = voterSet.size;
          const requiredVotes = Math.floor(activeRoomSize / 2) + 1;

          console.log(`[Vote Kick] Room ${currentHashtag}: ${votesCount}/${requiredVotes} votes to kick ${targetParticipant.alias}`);

          // Broadcast vote count update
          broadcastToRoom(currentHashtag, {
            type: 'vote_update',
            targetSessionId,
            targetAlias: targetParticipant.alias,
            votesCount,
            requiredVotes,
            voterSessionId: me.sessionId
          });

          // Check if more than 50% confirmed
          if (votesCount >= requiredVotes) {
            console.log(`[Vote Kick Success] Kicking ${targetParticipant.alias} from ${currentHashtag}`);

            // Expel the offending user
            targetParticipant.ws.send(JSON.stringify({
              type: 'kicked_out',
              message: `You have been democratically vote-kicked out of ${currentHashtag} by the room participants.`
            }));
            targetParticipant.ws.close();

            // Temporary block list for 24 hours (86400000 ms)
            blockedSessions.set(targetSessionId, {
              hashtag: currentHashtag,
              expires: Date.now() + 24 * 60 * 60 * 1000
            });

            // Clean up votes for this target
            room.kickVotes.delete(targetSessionId);

            // Broadcast expulsion
            broadcastToRoom(currentHashtag, {
              type: 'user_expelled',
              alias: targetParticipant.alias,
              sessionId: targetSessionId
            });

            // Disconnect participant programmatically
            room.participants.delete(targetParticipant.id);

            // Broadcast refreshed list
            broadcastParticipantList(currentHashtag);
          }
          return;
        }

        if (data.type === 'bot_sim_request') {
          // Elegant Simulation Sandbox mode directly connected on the server:
          // Spawns automated bots that behaves like other random users 
          // allowing solo users to inspect local muting, voting system, and voice
          const cleanHashtag = currentHashtag;
          const botSessionId = 'bot-' + Math.random().toString(36).substring(2, 8);
          const alias = generateUniqueAlias(new Set(Array.from(room.participants.values()).map(p => p.alias)));
          const color = IDENTICON_COLORS[Math.floor(Math.random() * IDENTICON_COLORS.length)];
          const shape = IDENTICON_SHAPES[Math.floor(Math.random() * IDENTICON_SHAPES.length)];
          const botId = 'bot_conn_' + Math.random().toString(36).substring(2, 8);

          // We mock a ws client so they fit inside our map
          const dummyWs = {
            send: () => {},
            close: () => {},
          } as unknown as WebSocket;

          const botParticipant: Participant = {
            id: botId,
            sessionId: botSessionId,
            alias,
            color,
            shape,
            ip: '127.0.0.1 (Simulation)',
            ws: dummyWs,
            isSpeaking: false,
            hasActiveVoice: true
          };

          room.participants.set(botId, botParticipant);

          broadcastToRoom(cleanHashtag, {
            type: 'user_joined',
            participant: {
              id: botId,
              sessionId: botSessionId,
              alias,
              color,
              shape,
              isSpeaking: false,
              hasActiveVoice: true
            }
          });

          // Send a greeting frombot after 1 second
          setTimeout(() => {
            const nextRoom = rooms.get(cleanHashtag);
            if (nextRoom && nextRoom.participants.has(botId)) {
              broadcastToRoom(cleanHashtag, {
                type: 'message',
                message: {
                  id: Math.random().toString(36).substring(2, 10),
                  sender: {
                    id: botId,
                    sessionId: botSessionId,
                    alias,
                    color,
                    shape
                  },
                  text: "Hello everyone! I'm a test participant simulated in memory to let you try the chat features! Try hovering over my avatar to privately mute me, or initiate a vote-kick against me!",
                  timestamp: Date.now(),
                  isBurn: false,
                  isSpoiler: false
                }
              });
            }
          }, 1000);

          broadcastParticipantList(cleanHashtag);
          return;
        }

        if (data.type === 'trigger_bot_roast') {
          const { botSessionId, targetSessionId } = data;
          
          let botParticipant: Participant | null = null;
          for (const p of room.participants.values()) {
            if (p.sessionId === botSessionId) {
              botParticipant = p;
              break;
            }
          }

          if (!botParticipant) return;

          let targetAlias = '';
          if (targetSessionId) {
            for (const p of room.participants.values()) {
              if (p.sessionId === targetSessionId) {
                targetAlias = p.alias;
                break;
              }
            }
          }

          // Generate roast
          const roastText = await generateTrashTalk(room.recentMessages || [], targetAlias);

          if (!room.recentMessages) {
            room.recentMessages = [];
          }
          room.recentMessages.push({ senderAlias: botParticipant.alias, text: roastText });
          if (room.recentMessages.length > 10) {
            room.recentMessages.shift();
          }

          broadcastToRoom(currentHashtag, {
            type: 'message',
            message: {
              id: Math.random().toString(36).substring(2, 10),
              sender: {
                id: botParticipant.id,
                sessionId: botParticipant.sessionId,
                alias: botParticipant.alias,
                color: botParticipant.color,
                shape: botParticipant.shape
              },
              text: roastText,
              timestamp: Date.now(),
              isBurn: false,
              isSpoiler: false
            }
          });
          return;
        }

      } catch (err) {
        console.error('[WS Msg Error]', err);
      }
    });

    ws.on('close', () => {
      console.log(`[WS Close] Client ${connectionId} disconnected`);
      if (currentHashtag) {
        const room = rooms.get(currentHashtag);
        if (room) {
          const participant = room.participants.get(connectionId);
          if (participant) {
            console.log(`[WS Leave] ${participant.alias} left ${currentHashtag}`);
            room.participants.delete(connectionId);

            // Clean up votes registered on target or cast by disconnected user
            room.kickVotes.delete(participant.sessionId);
            for (const [target, voters] of room.kickVotes.entries()) {
              if (voters.delete(participant.sessionId)) {
                if (voters.size === 0) {
                  room.kickVotes.delete(target);
                } else {
                  broadcastToRoom(currentHashtag, {
                    type: 'vote_update',
                    targetSessionId: target,
                    votesCount: voters.size,
                    requiredVotes: Math.floor(room.participants.size / 2) + 1,
                    voterSessionId: 'system'
                  });
                }
              }
            }

            // Notify remaining room participants
            broadcastToRoom(currentHashtag, {
              type: 'user_left',
              id: connectionId,
              alias: participant.alias,
              sessionId: participant.sessionId
            });

            // Update remaining participants list
            broadcastParticipantList(currentHashtag);
          }

          // If room is empty, self-destruct right away (FR-4.2)
          if (room.participants.size === 0) {
            rooms.delete(currentHashtag);
            console.log(`[Room Destruct] Pruned empty hashtag room: ${currentHashtag}`);
          }
        }
      }
    });
  });

  // Helper to return simple participant metadata
  function p_meta(p: Participant) {
    return {
      id: p.id,
      sessionId: p.sessionId,
      alias: p.alias,
      color: p.color,
      shape: p.shape
    };
  }

  // Broadcast to all sockets inside a specific hashtag room
  function broadcastToRoom(hashtag: string, eventObj: any, excludeConnectionId?: string) {
    const room = rooms.get(hashtag);
    if (!room) return;

    const rawString = JSON.stringify(eventObj);
    for (const [connId, participant] of room.participants.entries()) {
      if (connId === excludeConnectionId) continue;
      if (participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(rawString);
      }
    }
  }

  // Refreshes the room user list for all connected clients under a hashtag
  function broadcastParticipantList(hashtag: string) {
    const room = rooms.get(hashtag);
    if (!room) return;

    const list = Array.from(room.participants.values()).map(p => ({
      id: p.id,
      sessionId: p.sessionId,
      alias: p.alias,
      color: p.color,
      shape: p.shape,
      isSpeaking: p.isSpeaking,
      hasActiveVoice: p.hasActiveVoice
    }));

    broadcastToRoom(hashtag, {
      type: 'participants_update',
      participants: list
    });
  }

  // Room Self-Destruction: automatically prune inactive rooms after 30 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [hashtag, room] of rooms.entries()) {
      const expired = now - room.lastActivity > 30 * 60 * 1000;
      const empty = room.participants.size === 0;
      if (empty || expired) {
        console.log(`[Room Self-Destruction] ${hashtag} was deleted due to ${empty ? 'emptiness' : '30-minute inactivity'}`);
        // Notify any stranded clients (if any) and close them
        broadcastToRoom(hashtag, {
          type: 'room_disbanded',
          reason: 'This room has been automatically disbanded due to 30 minutes of inactivity.'
        });
        rooms.delete(hashtag);
      }
    }
  }, 60000); // Check once a minute

  // Integrate Vite dev server middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Standing up Anonymous Chat on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[FATAL SERVER ERROR]', err);
});

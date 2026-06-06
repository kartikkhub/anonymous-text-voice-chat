# Anonymous Text & Voice Chat

A modern, low-latency, private text and voice communication platform built with React, Vite, Express, and Web Audio API. It features real-time voice shifting (DSP), ambient sound masking, self-destructing rooms, and interactive AI chatbot simulation.

## Features

- **Real-Time Voice Scrambling (DSP):** Granular pitch and formant shifting directly in the browser to mask voice identity with minimal latency (<15ms).
- **Ambient Sound Overlays:** Procedural noise generation (rain, highway traffic, cafe murmur) layered locally over voice streams.
- **Ephemeral Messaging:** Message options including self-destruct (burn after reading) timers and hidden spoiler blocks.
- **Volatile Rooms:** Automatic room teardown after 30 minutes of inactivity. Zero persistent database tracking.
- **Democratic Moderation:** Built-in vote-to-kick system allowing rooms to moderate themselves.
- **Sandbox Mode:** Simulated bot peers to test DSP voice options and moderation tools offline.

## Project Structure

```
├── server.ts                 # Express & WebSocket Server (Handles routing & rooms)
├── src/
│   ├── App.tsx               # Main React frontend UI components
│   ├── components/           
│   │   ├── Identicon.tsx     # SVG avatar generator for anonymous peers
│   │   └── MessageItem.tsx   # Message render card (handling burn timers & spoilers)
│   ├── lib/
│   │   ├── audioDsp.ts       # Web Audio API Digital Signal Processing algorithms
│   │   └── useAnonymousChat.ts # WebSocket state-management & Audio streaming logic
│   ├── types.ts              # TypeScript type definitions
│   └── index.css             # Tailwind UI styles & keyframe animations
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kartikkhub/anonymous-text-voice-chat.git
   cd anonymous-text-voice-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and add your Gemini API Key (used for the AI chatbot roasts):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This is a full-stack Node.js application that uses persistent WebSocket connections. You can deploy it to platforms like Render or Railway:

### Deploy to Render
1. Create a **Web Service** on Render.
2. Link this GitHub repository.
3. Configure the build settings:
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add the `GEMINI_API_KEY` environment variable in the Render dashboard if you want the chatbot to function.

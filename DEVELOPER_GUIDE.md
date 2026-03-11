# SyncVerse - Comprehensive Developer Guide & Architecture Overview

This document is designed to give you (the developer) a complete, scratch-to-finish understanding of how SyncVerse is built, how the different pieces communicate, and exactly where every feature is coded. 

Use this guide as a master reference when explaining the project to recruiters, interviewers, or other developers.

---

## 🏗️ 1. High-Level Architecture
SyncVerse is a **Monorepo** (using Turborepo/npm workspaces) containing two main applications:
1. **Frontend (`apps/web`)**: A Next.js 14 application that serves the User Interface.
2. **Backend (`apps/server`)**: A Node.js + Express + Socket.IO server that handles database connections and real-time multiplayer synchronization.

### How Data Flows (The "Trinity" of SyncVerse):
SyncVerse uses three distinct methods of communication depending on the task:
1. **REST API (HTTP/HTTPS):** Used for standard, one-time requests like Logging In, Registering, Uploading Avatars, and fetching Room metadata. (e.g., frontend calls `/api/users/me`).
2. **WebSockets (Socket.IO):** Used for **Real-Time Text/State**. When a user pauses a video, sends a chat message, or joins a room, a tiny packet is sent to the server via WebSockets and instantly broadcast to everyone else in the room.
3. **WebRTC (Peer-to-Peer):** Used **ONLY** for Screen Sharing. Video streaming requires massive bandwidth. Instead of sending video through your Node.js server (which would crash it), WebRTC connects users' browsers *directly* to each other so they stream video peer-to-peer.

---

## 🛠️ 2. The Tech Stack
* **Frontend:** Next.js 14, React, Tailwind CSS, Zustand (State Management), Framer Motion (Animations), WebRTC API.
* **Backend:** Node.js, Express, Socket.IO, Prisma ORM.
* **Database:** PostgreSQL (Managed by Prisma).
* **Media Player:** `react-player` for YouTube/Soundcloud, Native HTML5 `<video>` for local files and WebRTC streams.

---

## 🗺️ 3. Feature Map: What Code Does What?

### A. Authentication & User Profiles
* **How it works:** Users can join as Guests or create accounts. Passwords are hashed. We use JWT (JSON Web Tokens) for security. Avatars are uploaded and converted to Base64 strings to be saved directly in the PostgreSQL database (preventing Render from deleting them).
* **Where it is coded:**
  * **Frontend UI:** `apps/web/src/components/HeroForm.tsx` (Login/Register UI).
  * **Frontend State:** `apps/web/src/store/useUserStore.ts` (Zustand store holding the JWT token, Avatar, and Bio).
  * **Frontend Hydration:** `apps/web/src/components/UserHydrator.tsx` (Automatically fetches the latest Avatar/Bio from the DB when the user opens the app).
  * **Backend Auth:** `apps/server/src/routes/auth.ts` (Handles login, bcrypt hashing, and JWT generation).
  * **Backend Profile:** `apps/server/src/routes/users.ts` (Handles `/me` fetches and Base64 Avatar database uploads).

### B. Room Creation & Joining
* **How it works:** A user creates a room. The backend generates a unique 6-character shortcode (using `nanoid`). Other users use this shortcode to fetch the room's true Database ID and connect.
* **Where it is coded:**
  * **Frontend UI:** `apps/web/src/app/page.tsx` (The home screen logic).
  * **Backend API:** `apps/server/src/routes/rooms.ts` (Creates the room in PostgreSQL and handles `/by-code/:code` lookups).

### C. Live Chat, Emotes, & Room Roster (Socket.IO)
* **How it works:** Once inside a room, the frontend establishes a persistent WebSocket connection. Chat messages and UI reactions (floating emojis) are broadcast through this socket.
* **Where it is coded:**
  * **Frontend Store:** `apps/web/src/store/useSocketStore.ts` (The orchestrator! It holds the `socket` object, the chat array, the room user list, and exposes functions like `sendChatMessage` and `connect`).
  * **Frontend UI:** `apps/web/src/app/room/[id]/page.tsx` (The huge file that renders the sidebar, the chat messages array, the GIF picker, and the user roster).
  * **Backend Logic:** `apps/server/src/index.ts` (Look for `socket.on('C2S_CHAT_MESSAGE', ...)` — this receives a text message and uses `io.to(roomId).emit('S2C_CHAT_MESSAGE', ...)` to send it to everyone else).

### D. Core Video Synchronization Engine
* **How it works:** This is the heart of SyncVerse. When the Host plays, pauses, or scrubs the video timeline, their `react-player` fires an event. This event is sent to the server, which broadcasts the exact timestamp and "PLAYING/PAUSED" state to all viewers. The viewers' hooks then force their local video players to jump to that timestamp.
* **Where it is coded:**
  * **Frontend Hook:** `apps/web/src/hooks/useSyncPlayback.ts`. This hook listens to the `roomState` (from Zustand). If the server says the video should be at 1m:30s but the local player is at 1m:25s, this hook forces the player to `seekTo(1m30s)`. It also contains "Drift Control" to subtly speed up or slow down the video if users get slightly out of sync.
  * **Frontend Player:** `apps/web/src/app/room/[id]/page.tsx` (The `<Player>` and `<video>` tags that actually render the pixels).
  * **Backend Logic:** `apps/server/src/index.ts` (Look for `C2S_STATE_UPDATE` — the server validates if the user is the Host or if DJ Mode is off, then updates the master room state).

### E. Screen Sharing (WebRTC)
* **How it works:** Screen sharing does NOT go through the Node.js server. Instead, it uses WebRTC (Web Real-Time Communication). 
  1. The sharer asks the browser for permission (`navigator.mediaDevices.getDisplayMedia`).
  2. The sharer's browser sends a "Call Offer" to a viewer through the Socket server (this is called "Signaling").
  3. The viewer's browser responds with an "Answer".
  4. Both browsers exchange "ICE Candidates" (their public IP addresses).
  5. Once connected, the video flows directly between Browser A and Browser B.
* **Where it is coded:**
  * **Frontend Hook:** `apps/web/src/hooks/useWebRTC.ts` (The masterpiece that handles `RTCPeerConnection`, `createOffer`, `createAnswer`, and applies encoding constraints like `maxBitrate` and `contentHint = "motion"` to ensure high FPS video streaming).
  * **Backend Signaling:** `apps/server/src/index.ts` (The server simply acts as a telephone operator, passing the `OFFER` and `ICE` packets from User A directly to User B without looking at them).

---

## 🎤 4. Common Technical Interview Questions & Answers

If a recruiter asks about this project, here is how you should answer:

### Q1: "How did you manage state across such a complex real-time application?"
**Your Answer:** "I used **Zustand** instead of Redux or React Context. In a real-time app, React Context causes too many unnecessary re-renders when data updates 60 times a second. Zustand allows me to store the Live Room State, Chat Messages, and Socket instance outside of the React Tree and selectively bind them to components, ensuring the UI stays completely buttery smooth even during heavy websocket traffic."

### Q2: "How did you handle the synchronization of the video player?"
**Your Answer:** "Building the sync engine was the hardest part. I don't just send 'play' or 'pause' commands. Instead, the backend maintains a 'Source of Truth' representing the physical state of the room (e.g., Status: PLAYING, Timestamp: 14.5s). The frontend uses a custom hook (`useSyncPlayback.ts`) that constantly compares its local video time against the server's Source of Truth. If a user's internet lags and they fall behind by a few seconds, my hook detects the 'Drift' and actually increases their playback speed to 1.05x temporarily until they catch back up to the host seamlessly."

### Q3: "If 10 people are in a room and someone screen shares an HD movie, doesn't that crash your server?"
**Your Answer:** "No, because I architected the screen sharing to use **WebRTC**, which operates **Peer-to-Peer**. My Node.js server acts only as a Signaling Server—it just introduces the users to each other by exchanging their IP addresses (ICE Candidates) via WebSockets. Once the handshake is complete, the actual Heavy Video Bandwidth flows directly from the Host's browser to the Viewers' browsers, completely bypassing my backend server. This saves thousands of dollars in server bandwidth costs."

### Q4: "What were some browser limitations you encountered and how did you solve them?"
**Your Answer:** "Two major ones: First, **Media Auto-Play Policies**. Browsers block videos from autoplaying if they contain sound to prevent annoying the user. When a WebRTC screen share arrived with audio, Chrome would silently block the video (showing a black screen). I fixed this by catching the `.play()` Promise rejection and rendering a 'Click to Play' overlay that allows the user to manually unlock the audio context. 
Second was **WebRTC encoding drops**. By default, Chrome's WebRTC engine assumes screen sharing is for presenting slide decks, so it throttles the framerate to 5 FPS. When sharing movies, this caused the encoder to choke and drop to a black screen. I solved this by injecting `contentHint = 'motion'` and enforcing a 3 Mbps `maxBitrate` constraint in the `getDisplayMedia` tracks to force a smooth 60fps video-optimized encode."

### Q5: "How did you handle file uploads for User Avatars on cloud platforms?"
**Your Answer:** "Originally, I used Multer to save uploaded image files to the server's disk. However, free-tier hosting platforms like Render use Ephemeral File Systems—meaning they wipe the hard drive every time the server goes to sleep. To make the avatars permanent without paying for an AWS S3 bucket, I modified the Multer middleware to use RAM (`memoryStorage`), converted the image buffer into a Data URI Base64 string, and saved that long string directly alongside the User's row in the PostgreSQL database."

---

## 📂 5. Quick Directory Reference

* `apps/web/src/app/` - Next.js App Router pages (Frontend routes).
* `apps/web/src/components/` - Reusable UI components (MediaSelector, QueuePanel, ReactionLayer).
* `apps/web/src/store/` - Zustand global state managers (`useUserStore`, `useSocketStore`).
* `apps/web/src/hooks/` - Core business logic separated from UI (`useSyncPlayback`, `useWebRTC`).
* `apps/server/src/index.ts` - Master backend file; contains HTTP server startup and ALL Socket.IO event listeners.
* `apps/server/src/routes/` - Express REST API routes (`auth`, `users`, `rooms`).
* `packages/shared/` - TypeScript Interfaces and Types shared between both frontend and backend to ensure Type Safety across the network boundary.
